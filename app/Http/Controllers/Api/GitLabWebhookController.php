<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\GitLabRepository;
use App\Services\GitLabService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class GitLabWebhookController extends Controller
{
    /**
     * Handle GitLab webhook events
     */
    public function handle(Request $request): JsonResponse
    {
        try {
            $event = $request->header('X-Gitlab-Event');
            $projectId = $request->input('project.id');
            $webhookToken = $request->header('X-Gitlab-Token');

            Log::info('GitLab webhook received', [
                'event' => $event,
                'project_id' => $projectId,
                'has_token' => !empty($webhookToken),
            ]);

            if (!$projectId) {
                return response()->json(['error' => 'No project ID found'], 400);
            }

            // First, find any GitLab integration that matches the webhook token
            $integration = null;
            if ($webhookToken) {
                $gitLabIntegrations = Integration::where('type', 'gitlab')
                    ->where('connected', true)
                    ->get();

                foreach ($gitLabIntegrations as $gitLabIntegration) {
                    $expectedToken = $gitLabIntegration->config['webhook_token'] ?? null;
                    if ($expectedToken && hash_equals($expectedToken, $webhookToken)) {
                        $integration = $gitLabIntegration;
                        break;
                    }
                }
            }

            if (!$integration) {
                Log::warning('No GitLab integration found for webhook token', [
                    'project_id' => $projectId,
                    'has_token' => !empty($webhookToken),
                ]);
                return response()->json(['error' => 'Invalid webhook token or no matching integration'], 401);
            }

            // Check if this project has explicitly tracked repositories
            $trackedRepositories = GitLabRepository::where('project_id', (string) $projectId)
                ->where('integration_id', $integration->id)
                ->where('active', true)
                ->get();

            // If we have tracked repositories, use their specific configuration
            // If not, we'll handle with default configuration
            $repositoryConfig = null;
            if ($trackedRepositories->isNotEmpty()) {
                $repositoryConfig = $trackedRepositories->first();
                Log::info('Using tracked repository configuration', [
                    'project_id' => $projectId,
                    'repository_name' => $repositoryConfig->full_name,
                ]);
            } else {
                Log::info('No tracked repositories, using default configuration', [
                    'project_id' => $projectId,
                    'integration_id' => $integration->id,
                ]);
            }

            switch ($event) {
                case 'Release Hook':
                    return $this->handleRelease($request, $integration, $repositoryConfig);

                case 'Tag Push Hook':
                    return $this->handleTagPush($request, $integration, $repositoryConfig);

                case 'Pipeline Hook':
                    return $this->handlePipeline($request, $integration, $repositoryConfig);

                default:
                    Log::info('Unhandled GitLab webhook event', ['event' => $event]);
                    return response()->json(['message' => 'Event not handled'], 200);
            }
        } catch (\Exception $e) {
            Log::error('GitLab webhook error', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Handle release events
     */
    private function handleRelease(Request $request, $integration, $repositoryConfig = null): JsonResponse
    {
        $release = $request->input('release');
        if (!$release) {
            return response()->json(['error' => 'No release data'], 400);
        }

        $tagName = $release['tag_name'];
        $releaseName = $release['name'] ?? $tagName;
        $description = $release['description'] ?? '';
        $project = $request->input('project');

        // Check if this is a production release
        if ($this->isProductionRelease($tagName, $repositoryConfig)) {
            $this->createReleaseActivity($integration, $project, [
                'tag_name' => $tagName,
                'name' => $releaseName,
                'description' => $description,
                'web_url' => $release['_links']['self'] ?? '',
                'created_at' => $release['created_at'],
            ]);

            // Update repository last release info if it's tracked
            if ($repositoryConfig) {
                $repositoryConfig->update([
                    'last_release_tag' => $tagName,
                    'last_release_at' => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Release processed successfully']);
    }

    /**
     * Handle tag push events
     */
    private function handleTagPush(Request $request, $integration, $repositoryConfig = null): JsonResponse
    {
        $ref = $request->input('ref');
        if (!str_starts_with($ref, 'refs/tags/')) {
            return response()->json(['message' => 'Not a tag push'], 200);
        }

        $tagName = str_replace('refs/tags/', '', $ref);
        $commit = $request->input('commits.0'); // Get the latest commit
        $project = $request->input('project');

        // Check if this is a production release
        if ($this->isProductionRelease($tagName, $repositoryConfig)) {
            $webUrl = $project['web_url'] ?? '' . '/-/tags/' . $tagName;

            $this->createReleaseActivity($integration, $project, [
                'tag_name' => $tagName,
                'name' => $tagName,
                'description' => $commit['message'] ?? 'New tag created',
                'web_url' => $webUrl,
                'created_at' => $commit['timestamp'] ?? now()->toISOString(),
            ]);

            // Update repository last release info if it's tracked
            if ($repositoryConfig) {
                $repositoryConfig->update([
                    'last_release_tag' => $tagName,
                    'last_release_at' => now(),
                ]);
            }
        }

        return response()->json(['message' => 'Tag push processed successfully']);
    }

    /**
     * Handle pipeline events (for deployment tracking)
     */
    private function handlePipeline(Request $request, $integration, $repositoryConfig = null): JsonResponse
    {
        $pipeline = $request->input('object_attributes');
        if (!$pipeline || $pipeline['status'] !== 'success') {
            return response()->json(['message' => 'Pipeline not successful'], 200);
        }

        // Check if this is a deployment pipeline
        $ref = $pipeline['ref'];
        $stage = $pipeline['stage'] ?? '';
        $project = $request->input('project');

        if ($this->isDeploymentPipeline($repositoryConfig, $ref, $stage)) {
            $this->createDeploymentActivity($integration, $project, $pipeline);
        }

        return response()->json(['message' => 'Pipeline processed successfully']);
    }

    /**
     * Create a release activity
     */
    private function createReleaseActivity($integration, array $projectData, array $releaseData): void
    {
        $ecosystem = $integration->ecosystem;
        $repositoryName = $projectData['path_with_namespace'] ?? $projectData['name'] ?? 'Unknown Repository';

        $title = "Release {$releaseData['tag_name']} deployed";
        $description = "New release {$releaseData['tag_name']} of {$repositoryName} has been deployed to production.";

        if (!empty($releaseData['description'])) {
            $description .= "\n\nRelease notes: " . $releaseData['description'];
        }

        $ecosystem->activities()->create([
            'title' => $title,
            'description' => $description,
            'user_name' => 'GitLab Release',
            'activity_type_id' => $this->getOrCreateActivityType($ecosystem, 'Release'),
            'metadata' => [
                'integration_id' => $integration->id,
                'project_id' => $projectData['id'],
                'repository_name' => $repositoryName,
                'repository_url' => $projectData['web_url'] ?? '',
                'tag_name' => $releaseData['tag_name'],
                'release_name' => $releaseData['name'],
                'release_url' => $releaseData['web_url'],
                'created_at' => $releaseData['created_at'],
            ],
        ]);

        Log::info('GitLab release activity created', [
            'repository' => $repositoryName,
            'tag' => $releaseData['tag_name'],
            'ecosystem' => $ecosystem->name,
        ]);
    }

    /**
     * Create a deployment activity
     */
    private function createDeploymentActivity($integration, array $projectData, array $pipelineData): void
    {
        $ecosystem = $integration->ecosystem;
        $repositoryName = $projectData['path_with_namespace'] ?? $projectData['name'] ?? 'Unknown Repository';

        $ref = $pipelineData['ref'];
        $title = "Deployment to production";
        $description = "Pipeline #{$pipelineData['id']} deployed branch {$ref} of {$repositoryName} to production.";

        $ecosystem->activities()->create([
            'title' => $title,
            'description' => $description,
            'user_name' => 'GitLab Pipeline',
            'activity_type_id' => $this->getOrCreateActivityType($ecosystem, 'Deployment'),
            'metadata' => [
                'integration_id' => $integration->id,
                'project_id' => $projectData['id'],
                'repository_name' => $repositoryName,
                'repository_url' => $projectData['web_url'] ?? '',
                'pipeline_id' => $pipelineData['id'],
                'ref' => $ref,
                'pipeline_url' => $pipelineData['url'] ?? '',
                'finished_at' => $pipelineData['finished_at'],
            ],
        ]);
    }

    /**
     * Check if pipeline is a deployment pipeline
     */
    private function isDeploymentPipeline($repositoryConfig, string $ref, string $stage): bool
    {
        // Use repository-specific config if available, otherwise use defaults
        $productionBranches = $repositoryConfig?->production_branches ?? ['main', 'master', 'production'];

        // Check if the ref matches production branches
        if (in_array($ref, $productionBranches)) {
            return true;
        }

        // Check if stage indicates deployment
        $deploymentStages = ['deploy', 'production', 'release'];
        return in_array(strtolower($stage), $deploymentStages);
    }

    /**
     * Check if this is a production release
     */
    private function isProductionRelease(string $tagName, $repositoryConfig = null): bool
    {
        // Use repository-specific staging keywords if available, otherwise use defaults
        $stagingKeywords = $repositoryConfig?->staging_keywords ?? ['beta', 'rc', 'staging', 'dev', 'alpha'];

        // Check if tag contains any staging keywords
        foreach ($stagingKeywords as $keyword) {
            if (str_contains(strtolower($tagName), strtolower($keyword))) {
                return false; // This is a staging release
            }
        }

        return true; // This is a production release
    }

    /**
     * Get or create activity type
     */
    private function getOrCreateActivityType($ecosystem, string $name): int
    {
        $activityType = $ecosystem->activityTypes()
            ->where('name', $name)
            ->first();

        if (!$activityType) {
            $color = $name === 'Release' ? '#10b981' : '#3b82f6';
            $icon = $name === 'Release' ? 'git-branch' : 'rocket';

            $activityType = $ecosystem->activityTypes()->create([
                'name' => $name,
                'color' => $color,
                'icon' => $icon,
            ]);
        }

        return $activityType->id;
    }
}
