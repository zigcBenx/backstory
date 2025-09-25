<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    use AuthorizesRequests;

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

        $validated = $request->validate([
            'type' => 'required|string',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string',
            'category' => 'required|string',
            'config' => 'nullable|array',
        ]);

        $ecosystem->integrations()->create([
            ...$validated,
            'connected' => true,
        ]);

        return back();
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

    private function getAvailableIntegrations(): array
    {
        return [
            [
                'type' => 'gitlab',
                'name' => 'GitLab',
                'description' => 'Track deployments and repository changes',
                'icon' => 'git-branch',
                'category' => 'Version Control',
            ],
            [
                'type' => 'github',
                'name' => 'GitHub',
                'description' => 'Monitor commits, PRs, and releases',
                'icon' => 'github',
                'category' => 'Version Control',
            ],
            [
                'type' => 'sentry',
                'name' => 'Sentry',
                'description' => 'Error tracking and performance monitoring',
                'icon' => 'shield',
                'category' => 'Monitoring',
            ],
            [
                'type' => 'terraform',
                'name' => 'Terraform',
                'description' => 'Infrastructure as code changes',
                'icon' => 'box',
                'category' => 'Infrastructure',
            ],
            [
                'type' => 'nginx',
                'name' => 'Nginx',
                'description' => 'Web server configuration changes',
                'icon' => 'server',
                'category' => 'Infrastructure',
            ],
            [
                'type' => 'webhook',
                'name' => 'Custom Webhook',
                'description' => 'Connect any service via webhook',
                'icon' => 'webhook',
                'category' => 'Custom',
            ],
        ];
    }
}
