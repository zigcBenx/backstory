<?php

namespace App\Services;

use App\Models\Integration;
use App\Models\GitLabRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GitLabService
{
    private string $baseUrl;
    private string $accessToken;

    public function __construct(string $baseUrl = 'https://gitlab.com', string $accessToken = '')
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->accessToken = $accessToken;
    }

    /**
     * Create GitLab service from integration config
     */
    public static function fromIntegration(Integration $integration): self
    {
        $config = $integration->config ?? [];

        return new self(
            $config['gitlab_url'] ?? 'https://gitlab.com',
            $config['access_token'] ?? ''
        );
    }

    /**
     * Test the GitLab connection and token
     */
    public function testConnection(): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . '/api/v4/user');

            if ($response->successful()) {
                $user = $response->json();
                return [
                    'success' => true,
                    'user' => $user['name'] ?? $user['username'],
                    'username' => $user['username'],
                ];
            }

            return [
                'success' => false,
                'error' => 'Invalid credentials or API error',
                'status' => $response->status(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Search for repositories
     */
    public function searchRepositories(string $query, int $perPage = 20): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . '/api/v4/projects', [
                    'search' => $query,
                    'per_page' => $perPage,
                    'order_by' => 'updated_at',
                    'sort' => 'desc',
                    'membership' => true, // Only projects user is a member of
                ]);

            if ($response->successful()) {
                return array_map([$this, 'formatRepository'], $response->json());
            }

            Log::error('GitLab API error in searchRepositories', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        } catch (\Exception $e) {
            Log::error('GitLab service error in searchRepositories', [
                'error' => $e->getMessage(),
                'query' => $query,
            ]);

            return [];
        }
    }

    /**
     * Get user's repositories
     */
    public function getUserRepositories(int $perPage = 50): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . '/api/v4/projects', [
                    'per_page' => $perPage,
                    'order_by' => 'updated_at',
                    'sort' => 'desc',
                    'membership' => true,
                    'archived' => false,
                ]);

            if ($response->successful()) {
                return array_map([$this, 'formatRepository'], $response->json());
            }

            return [];
        } catch (\Exception $e) {
            Log::error('GitLab service error in getUserRepositories', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Get repository by project ID
     */
    public function getRepository(string $projectId): ?array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . "/api/v4/projects/{$projectId}");

            if ($response->successful()) {
                return $this->formatRepository($response->json());
            }

            return null;
        } catch (\Exception $e) {
            Log::error('GitLab service error in getRepository', [
                'error' => $e->getMessage(),
                'project_id' => $projectId,
            ]);

            return null;
        }
    }

    /**
     * Get latest releases for a repository
     */
    public function getLatestReleases(string $projectId, int $limit = 10): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . "/api/v4/projects/{$projectId}/releases", [
                    'per_page' => $limit,
                    'order_by' => 'created_at',
                    'sort' => 'desc',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [];
        } catch (\Exception $e) {
            Log::error('GitLab service error in getLatestReleases', [
                'error' => $e->getMessage(),
                'project_id' => $projectId,
            ]);

            return [];
        }
    }

    /**
     * Get latest tags for a repository (fallback if no releases)
     */
    public function getLatestTags(string $projectId, int $limit = 10): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->get($this->baseUrl . "/api/v4/projects/{$projectId}/repository/tags", [
                    'per_page' => $limit,
                    'order_by' => 'updated',
                    'sort' => 'desc',
                ]);

            if ($response->successful()) {
                return $response->json();
            }

            return [];
        } catch (\Exception $e) {
            Log::error('GitLab service error in getLatestTags', [
                'error' => $e->getMessage(),
                'project_id' => $projectId,
            ]);

            return [];
        }
    }

    /**
     * Check for new releases since last check
     */
    public function checkForNewReleases(GitLabRepository $repository): array
    {
        $newReleases = [];

        // Try releases first
        $releases = $this->getLatestReleases($repository->project_id, 5);

        if (!empty($releases)) {
            foreach ($releases as $release) {
                if ($this->isNewRelease($release['tag_name'], $repository->last_release_tag, $repository->last_release_at)) {
                    if ($repository->isProductionRelease($release['tag_name'])) {
                        $newReleases[] = [
                            'type' => 'release',
                            'tag_name' => $release['tag_name'],
                            'name' => $release['name'] ?? $release['tag_name'],
                            'description' => $release['description'] ?? '',
                            'created_at' => $release['created_at'],
                            'web_url' => $release['_links']['self'] ?? '',
                            'commit' => $release['commit'] ?? null,
                        ];
                    }
                }
            }
        } else {
            // Fallback to tags if no releases
            $tags = $this->getLatestTags($repository->project_id, 5);

            foreach ($tags as $tag) {
                if ($this->isNewRelease($tag['name'], $repository->last_release_tag, $repository->last_release_at)) {
                    if ($repository->isProductionRelease($tag['name'])) {
                        $newReleases[] = [
                            'type' => 'tag',
                            'tag_name' => $tag['name'],
                            'name' => $tag['name'],
                            'description' => $tag['message'] ?? '',
                            'created_at' => $tag['commit']['created_at'] ?? now()->toISOString(),
                            'web_url' => $repository->url . '/-/tags/' . $tag['name'],
                            'commit' => $tag['commit'] ?? null,
                        ];
                    }
                }
            }
        }

        return $newReleases;
    }

    /**
     * Format repository data from GitLab API
     */
    private function formatRepository(array $repo): array
    {
        return [
            'project_id' => (string) $repo['id'],
            'name' => $repo['name'],
            'full_name' => $repo['path_with_namespace'],
            'description' => $repo['description'] ?? '',
            'url' => $repo['web_url'],
            'default_branch' => $repo['default_branch'] ?? 'main',
            'last_activity_at' => $repo['last_activity_at'] ?? null,
            'namespace' => $repo['namespace']['name'] ?? '',
        ];
    }

    /**
     * Check if a release is newer than the last known release
     */
    private function isNewRelease(string $newTag, ?string $lastTag, ?\Carbon\Carbon $lastReleaseAt): bool
    {
        if (!$lastTag) {
            return true;
        }

        if ($newTag === $lastTag) {
            return false;
        }

        // Simple comparison - in a real implementation you might want to use semantic versioning comparison
        return true;
    }
}