<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use App\Models\IntegrationApiKey;
use App\Models\InstallationToken;
use App\Services\IntegrationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class IntegrationWebhookController extends Controller
{
    public function __construct(
        private IntegrationService $integrationService
    ) {}

    /**
     * Handle heartbeat pings from server monitors
     */
    public function heartbeat(Request $request): JsonResponse
    {
        logger("Heartbeat request");
        try {
            $apiKey = $this->validateApiKey($request);

            $request->validate([
                'type' => 'required|string|in:heartbeat',
                'ecosystem_id' => 'required|integer',
                'integration_id' => 'required|integer',
                'timestamp' => 'required|string',
                'status' => 'required|string|in:online,offline,error',
                'server_info' => 'sometimes|array',
            ]);

            $integration = $this->findIntegration($apiKey, $request->integration_id);

            $this->integrationService->processHeartbeat($integration, $request->all());

            $apiKey->markAsUsed();

            return response()->json([
                'status' => 'success',
                'message' => 'Heartbeat received',
                'timestamp' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            Log::error('Integration heartbeat error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'api_key' => $request->header('X-API-Key') ? 'present' : 'missing',
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Handle file change notifications from server monitors
     */
    public function fileChange(Request $request): JsonResponse
    {
        try {
            $apiKey = $this->validateApiKey($request);

            $request->validate([
                'type' => 'required|string|in:file_change',
                'ecosystem_id' => 'required|integer',
                'integration_id' => 'required|integer',
                'timestamp' => 'required|string',
                'file_path' => 'required|string',
                'event_type' => 'required|string',
                'file_type' => 'required|string',
                'file_content' => 'sometimes|string',
                'before_content' => 'sometimes|string',
                'after_content' => 'sometimes|string',
                'server_info' => 'sometimes|array',
            ]);

            $integration = $this->findIntegration($apiKey, $request->integration_id);

            $this->integrationService->processFileChange($integration, $request->all());

            // Create activity record for this file change
            $this->createActivityForFileChange($integration, $request->all());

            $apiKey->markAsUsed();

            return response()->json([
                'status' => 'success',
                'message' => 'File change recorded',
                'timestamp' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            Log::error('Integration file change error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'api_key' => $request->header('X-API-Key') ? 'present' : 'missing',
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Validate API key and return the key model
     */
    private function validateApiKey(Request $request): IntegrationApiKey
    {
        $apiKeyValue = $request->header('X-API-Key');

        if (!$apiKeyValue) {
            throw new \Exception('API key is required');
        }

        $apiKey = IntegrationApiKey::where('key', $apiKeyValue)
            ->where('active', true)
            ->first();

        if (!$apiKey) {
            throw new \Exception('Invalid or inactive API key');
        }

        return $apiKey;
    }

    /**
     * Find integration by API key and integration ID
     */
    private function findIntegration(IntegrationApiKey $apiKey, int $integrationId): Integration
    {
        $integration = $apiKey->integration;

        if (!$integration || $integration->id !== $integrationId) {
            throw new \Exception('Integration not found or API key mismatch');
        }

        return $integration;
    }

    /**
     * Create an activity record for file change
     */
    private function createActivityForFileChange(Integration $integration, array $data): void
    {
        $fileType = ucfirst($data['file_type']);
        $eventType = ucfirst($data['event_type']);
        $fileName = basename($data['file_path']);

        $title = "{$fileType} Configuration {$eventType}";
        $hostname = $data['server_info']['hostname'] ?? 'unknown server';
        $description = "File {$fileName} was {$data['event_type']} on {$hostname}";

        $integration->ecosystem->activities()->create([
            'title' => $title,
            'description' => $description,
            'user_name' => 'Server Monitor',
            'activity_type_id' => $this->getOrCreateActivityType($integration->ecosystem, 'Server Change'),
            'metadata' => [
                'integration_id' => $integration->id,
                'file_path' => $data['file_path'],
                'event_type' => $data['event_type'],
                'file_type' => $data['file_type'],
                'server_info' => $data['server_info'] ?? null,
                'before_content' => $data['before_content'] ?? null,
                'after_content' => $data['after_content'] ?? null,
                'file_content' => $data['file_content'] ?? null, // Keep for backward compatibility
            ],
        ]);
    }

    /**
     * Get or create activity type for server changes
     */
    private function getOrCreateActivityType($ecosystem, string $name): int
    {
        $activityType = $ecosystem->activityTypes()
            ->where('name', $name)
            ->first();

        if (!$activityType) {
            $activityType = $ecosystem->activityTypes()->create([
                'name' => $name,
                'color' => '#f59e0b',
                'icon' => 'server',
            ]);
        }

        return $activityType->id;
    }

    /**
     * Exchange installation token for integration credentials
     */
    public function install(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'installation_token' => 'required|string|size:64', // bsi_60chars = 4 + 60 = 64 total
            ]);

            // Find and validate the installation token
            $installationToken = InstallationToken::where('token', $request->installation_token)
                ->valid()
                ->first();

            if (!$installationToken) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid, expired, or already used installation token.',
                ], 400);
            }


            // Get the existing integration that this token was created for
            $integration = $installationToken->integration;

            if (!$integration) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Integration not found for this installation token.',
                ], 400);
            }

            // Add this server to the integration's connected servers
            $connectedServers = $integration->config['connected_servers'] ?? [];
            $serverInfo = [
                'hostname' => gethostname(),
                'ip' => $request->ip(),
                'installed_at' => now()->toISOString(),
                'token_name' => $installationToken->name,
            ];

            $connectedServers[] = $serverInfo;

            // Update integration config with new server
            $integration->update([
                'connected' => true,
                'config' => array_merge($integration->config ?? [], [
                    'connected_servers' => $connectedServers,
                    'paths' => $installationToken->metadata['paths'] ?? [],
                ]),
                'last_sync_at' => now(),
            ]);

            // Create API key for this server
            $apiKey = $integration->apiKeys()->create([
                'name' => ($installationToken->name ?? 'Server') . ' - API Key',
                'scopes' => ['heartbeat', 'file-change'],
            ]);

            // Mark installation token as used
            $installationToken->markAsUsed();

            Log::info('Server connected to integration via token', [
                'ecosystem_id' => $installationToken->ecosystem_id,
                'integration_id' => $integration->id,
                'token_id' => $installationToken->id,
                'server_hostname' => gethostname(),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Server connected to integration successfully',
                'api_key' => $apiKey->key,
                'ecosystem_id' => $installationToken->ecosystem_id,
                'integration_id' => $integration->id,
                'paths' => $installationToken->metadata['paths'] ?? [],
            ]);

        } catch (\Exception $e) {
            Log::error('Installation token exchange failed', [
                'token' => $request->installation_token ? 'present' : 'missing',
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Installation failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
