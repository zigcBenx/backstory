<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use App\Models\Integration;
use App\Services\IntegrationService;
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

        return redirect()->back()->with('success', 'Integration created successfully!');
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
                'description' => 'Track deployments and repository changes',
                'icon' => 'git-branch',
                'category' => 'Version Control',
                'isActive' => false,
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
