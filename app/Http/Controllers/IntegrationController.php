<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use App\Models\Integration;
use App\Models\GitLabRepository;
use App\Services\IntegrationService;
use App\Services\GitLabService;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private IntegrationService $integrationService
    ) {}

    public function index(Ecosystem $ecosystem)
    {
        $this->authorize('view', $ecosystem);

        $ecosystem->load(['integrations', 'users']);

        return Inertia::render('ManageIntegrations', [
            'ecosystem' => $ecosystem,
            'availableIntegrations' => $this->getAvailableIntegrations(),
        ]);
    }

    public function store(Request $request, Ecosystem $ecosystem)
    {
        $this->authorize('update', $ecosystem);

        Log::info('Integration store request:', $request->all());

        $validated = $request->validate([
            'type' => 'required|string',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'category' => 'required|string',
            'config' => 'nullable|array',
            'config.monitoring' => 'nullable|array',
            'config.custom_paths' => 'nullable|array',
            'config.gitlab_url' => 'nullable|url',
            'config.access_token' => 'nullable|string',
            'config.webhook_token' => 'nullable|string',
        ]);

        Log::info('Validated integration data:', $validated);

        // Handle server monitoring integration specially
        if ($validated['type'] === 'server-monitor') {
            Log::info('Creating server monitoring integration');

            $integration = $this->integrationService->createServerMonitoring([
                'ecosystem_id' => $ecosystem->id,
                'name' => $validated['name'],
                'monitoring' => $validated['config']['monitoring'] ?? [],
                'custom_paths' => $validated['config']['custom_paths'] ?? [],
            ]);

            Log::info('Server monitoring integration created:', ['id' => $integration->id]);
        } elseif ($validated['type'] === 'gitlab') {
            Log::info('Creating GitLab integration');

            $integration = $ecosystem->integrations()->create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'description' => $validated['description'],
                'icon' => $validated['icon'],
                'category' => $validated['category'],
                'connected' => true,
                'config' => [
                    'gitlab_url' => $validated['config']['gitlab_url'] ?? 'https://gitlab.com',
                    'access_token' => $validated['config']['access_token'] ?? '',
                    'webhook_token' => $validated['config']['webhook_token'] ?? '',
                ],
            ]);

            Log::info('GitLab integration created:', ['id' => $integration->id]);
        } else {
            $integration = $ecosystem->integrations()->create([
                ...$validated,
                'connected' => true,
            ]);
        }

        Log::info('Returning success response');

        // If it's a server monitoring integration, return the integration ID for auto-opening install command
        if ($validated['type'] === 'server-monitor') {
            Log::info('Setting flash data for auto-opening install command', [
                'integration_id' => $integration->id,
                'show_install_command' => true
            ]);

            return redirect()->back()->with([
                'success' => 'Integration created successfully!',
                'new_integration_id' => $integration->id,
                'show_install_command' => true
            ]);
        }

        return redirect()->back()->with([
            'success' => 'Integration created successfully!',
            'new_integration_id' => $integration->id,
        ]);
    }

    public function update(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration->ecosystem);

        $validated = $request->validate([
            'connected' => 'boolean',
            'config' => 'nullable|array',
        ]);

        $integration->update($validated);

        if ($validated['connected'] ?? false) {
            $integration->update(['last_sync_at' => now()]);
        }

        return back();
    }

    public function destroy(Integration $integration)
    {
        $this->authorize('update', $integration->ecosystem);

        $integration->delete();

        return back();
    }

    public function downloadScript(Integration $integration)
    {
        $this->authorize('view', $integration->ecosystem);

        if ($integration->type !== 'server-monitor') {
            abort(404, 'Script not available for this integration type');
        }

        try {
            $script = $this->integrationService->generateMonitoringScript($integration);

            return response($script)
                ->header('Content-Type', 'text/plain')
                ->header('Content-Disposition', 'attachment; filename="backstory-monitor.sh"');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function getScript(Integration $integration)
    {
        // No authorization needed - this is a public endpoint for installation

        if ($integration->type !== 'server-monitor') {
            abort(404, 'Script not available for this integration type');
        }

        try {
            $script = $this->integrationService->generateMonitoringScript($integration);
            logger("ALOHA");
            logger($script);

            return response($script)
                ->header('Content-Type', 'text/plain')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate');

        } catch (\Exception $e) {
            abort(500, 'Unable to generate script: ' . $e->getMessage());
        }
    }

    public function getInstallCommand(Integration $integration)
    {
        $this->authorize('view', $integration->ecosystem);

        if ($integration->type !== 'server-monitor') {
            return response()->json(['error' => 'Installation command not available for this integration type'], 404);
        }

        $scriptUrl = route('integrations.get-script', $integration);
        $installCommand = "curl -sSL {$scriptUrl} | sudo bash";

        return response()->json([
            'command' => $installCommand,
            'script_url' => $scriptUrl,
        ]);
    }

    public function testGitLabConnection(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration->ecosystem);

        $validated = $request->validate([
            'gitlab_url' => 'required|url',
            'access_token' => 'required|string',
        ]);

        try {
            $gitLabService = new GitLabService(
                $validated['gitlab_url'],
                $validated['access_token']
            );

            $result = $gitLabService->testConnection();

            // Return as Inertia response with flash data
            return redirect()->back()->with([
                'gitlab_test_result' => $result,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'gitlab_test_result' => [
                    'success' => false,
                    'error' => $e->getMessage(),
                ],
            ]);
        }
    }

    public function searchGitLabRepositories(Request $request, Integration $integration)
    {
        $this->authorize('view', $integration->ecosystem);

        $validated = $request->validate([
            'query' => 'required|string|min:2',
        ]);

        try {
            $gitLabService = GitLabService::fromIntegration($integration);
            $repositories = $gitLabService->searchRepositories($validated['query']);

            return response()->json($repositories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getGitLabRepositories(Integration $integration)
    {
        $this->authorize('view', $integration->ecosystem);

        try {
            $gitLabService = GitLabService::fromIntegration($integration);
            $repositories = $gitLabService->getUserRepositories();

            return response()->json($repositories);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function addGitLabRepository(Request $request, Integration $integration)
    {
        $this->authorize('update', $integration->ecosystem);

        $validated = $request->validate([
            'project_id' => 'required|string',
            'name' => 'required|string',
            'full_name' => 'required|string',
            'url' => 'required|url',
            'default_branch' => 'required|string',
            'production_branches' => 'array',
            'staging_keywords' => 'array',
            'track_deployments_only' => 'boolean',
        ]);

        try {
            $repository = $integration->gitLabRepositories()->create([
                'project_id' => $validated['project_id'],
                'name' => $validated['name'],
                'full_name' => $validated['full_name'],
                'url' => $validated['url'],
                'default_branch' => $validated['default_branch'],
                'production_branches' => $validated['production_branches'] ?? ['main', 'master'],
                'staging_keywords' => $validated['staging_keywords'] ?? ['beta', 'rc', 'staging'],
                'track_deployments_only' => $validated['track_deployments_only'] ?? false,
            ]);

            return redirect()->back()->with([
                'success' => 'Repository added successfully!',
                'new_repository' => $repository,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Failed to add repository: ' . $e->getMessage(),
            ]);
        }
    }

    public function removeGitLabRepository(Integration $integration, GitLabRepository $repository)
    {
        $this->authorize('update', $integration->ecosystem);

        if ($repository->integration_id !== $integration->id) {
            abort(404);
        }

        $repository->delete();

        return response()->json(['success' => true]);
    }

    public function getTrackedGitLabRepositories(Integration $integration)
    {
        $this->authorize('view', $integration->ecosystem);

        $repositories = $integration->gitLabRepositories()
            ->where('active', true)
            ->get();

        return response()->json($repositories);
    }

    private function getAvailableIntegrations(): array
    {
        $availableIntegrations = [
            [
                'type' => 'server-monitor',
                'name' => 'Server Configuration Monitor',
                'description' => 'Monitor server configuration files for changes (nginx, apache, ssh, ssl, cron)',
                'icon' => 'server',
                'category' => 'Infrastructure',
                'isActive' => true,
                'configurable' => true,
                'availableTypes' => $this->integrationService->getAvailableTypes(),
            ],
            [
                'type' => 'gitlab',
                'name' => 'GitLab',
                'description' => 'Track releases and deployments from GitLab repositories',
                'icon' => 'git-branch',
                'category' => 'Version Control',
                'isActive' => true,
                'configurable' => true,
            ],
            [
                'type' => 'github',
                'name' => 'GitHub',
                'description' => 'Monitor commits, PRs, and releases',
                'icon' => 'github',
                'category' => 'Version Control',
                'isActive' => false,
            ],
            [
                'type' => 'sentry',
                'name' => 'Sentry',
                'description' => 'Error tracking and performance monitoring',
                'icon' => 'shield',
                'category' => 'Monitoring',
                'isActive' => false,
            ],
            [
                'type' => 'terraform',
                'name' => 'Terraform',
                'description' => 'Infrastructure as code changes',
                'icon' => 'box',
                'category' => 'Infrastructure',
                'isActive' => false,
            ],
            [
                'type' => 'nginx',
                'name' => 'Nginx',
                'description' => 'Web server configuration changes',
                'icon' => 'server',
                'category' => 'Infrastructure',
                'isActive' => false,
            ],
            [
                'type' => 'webhook',
                'name' => 'Custom Webhook',
                'description' => 'Connect any service via webhook',
                'icon' => 'webhook',
                'category' => 'Custom',
                'isActive' => false,
            ],
        ];

        return $availableIntegrations;
    }
}
