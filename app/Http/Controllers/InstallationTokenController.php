<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use App\Models\InstallationToken;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class InstallationTokenController extends Controller
{
    public function index(Ecosystem $ecosystem)
    {
        // Check if user owns this ecosystem
        if (!$ecosystem->users->contains(auth()->id())) {
            abort(403);
        }

        $tokens = $ecosystem->installationTokens()
            ->with('createdBy')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($token) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token' => $token->status === 'active' ? $token->token : null, // Hide used/expired tokens
                    'integration_type' => $token->integration_type,
                    'status' => $token->status,
                    'created_at' => $token->created_at,
                    'expires_at' => $token->expires_at,
                    'used_at' => $token->used_at,
                    'created_by' => $token->createdBy->name,
                ];
            });

        return Inertia::render('Ecosystem/InstallationTokens', [
            'ecosystem' => $ecosystem,
            'tokens' => $tokens,
        ]);
    }

    public function create(Ecosystem $ecosystem)
    {
        // Check if user owns this ecosystem
        if (!$ecosystem->users->contains(auth()->id())) {
            abort(403);
        }

        return Inertia::render('Ecosystem/CreateInstallationToken', [
            'ecosystem' => $ecosystem,
        ]);
    }

    public function store(Request $request, Ecosystem $ecosystem)
    {
        // Check if user owns this ecosystem
        if (!$ecosystem->users->contains(auth()->id())) {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'integration_type' => 'required|string|in:server_monitor',
            'expires_hours' => 'required|integer|min:1|max:168', // Max 7 days
            'paths' => 'sometimes|array',
            'integration_id' => 'sometimes|integer|exists:integrations,id',
        ]);

        $token = $ecosystem->installationTokens()->create([
            'created_by_user_id' => auth()->id(),
            'integration_id' => $request->integration_id,
            'name' => $request->name,
            'integration_type' => $request->integration_type,
            'expires_at' => now()->addHours($request->expires_hours),
            'metadata' => [
                'paths' => $request->paths ?? [],
                'created_from_ip' => $request->ip(),
            ],
        ]);

        Log::info('Installation token created', [
            'ecosystem_id' => $ecosystem->id,
            'token_id' => $token->id,
            'user_id' => auth()->id(),
            'name' => $token->name,
        ]);

        // For JSON API requests, return token data directly
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Installation token created successfully!',
                'token' => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token' => $token->token,
                    'integration_type' => $token->integration_type,
                    'status' => $token->status,
                    'created_at' => $token->created_at,
                    'expires_at' => $token->expires_at,
                ]
            ]);
        }

        // For regular form submissions, return to the tokens index with the new token data for modal display
        return redirect()->route('ecosystems.installation-tokens.index', $ecosystem)
            ->with([
                'success' => 'Installation token created successfully!',
                'newToken' => [
                    'id' => $token->id,
                    'name' => $token->name,
                    'token' => $token->token,
                    'integration_type' => $token->integration_type,
                    'status' => $token->status,
                    'created_at' => $token->created_at,
                    'expires_at' => $token->expires_at,
                ]
            ]);
    }

    public function show(Ecosystem $ecosystem, InstallationToken $token)
    {
        // Check if user owns this ecosystem and token belongs to ecosystem
        if (!$ecosystem->users->contains(auth()->id()) || $token->ecosystem_id !== $ecosystem->id) {
            abort(403);
        }

        return Inertia::render('Ecosystem/ShowInstallationToken', [
            'ecosystem' => $ecosystem,
            'token' => [
                'id' => $token->id,
                'name' => $token->name,
                'token' => $token->status === 'active' ? $token->token : null,
                'integration_type' => $token->integration_type,
                'status' => $token->status,
                'created_at' => $token->created_at,
                'expires_at' => $token->expires_at,
                'used_at' => $token->used_at,
                'created_by' => $token->createdBy->name,
                'metadata' => $token->metadata,
            ],
            'install_command' => 'curl -sSL ' . url('/install.sh') . ' | bash',
        ]);
    }

    public function revoke(Request $request, Ecosystem $ecosystem, InstallationToken $token)
    {
        // Check if user owns this ecosystem and token belongs to ecosystem
        if (!$ecosystem->users->contains(auth()->id()) || $token->ecosystem_id !== $ecosystem->id) {
            abort(403);
        }

        $token->revoke();

        Log::info('Installation token revoked', [
            'ecosystem_id' => $ecosystem->id,
            'token_id' => $token->id,
            'user_id' => auth()->id(),
            'name' => $token->name,
        ]);

        return redirect()->back()->with('success', 'Installation token revoked successfully.');
    }

    public function destroy(Ecosystem $ecosystem, InstallationToken $token)
    {
        // Check if user owns this ecosystem and token belongs to ecosystem
        if (!$ecosystem->users->contains(auth()->id()) || $token->ecosystem_id !== $ecosystem->id) {
            abort(403);
        }

        Log::info('Installation token deleted', [
            'ecosystem_id' => $ecosystem->id,
            'token_id' => $token->id,
            'user_id' => auth()->id(),
            'name' => $token->name,
        ]);

        $token->delete();

        return redirect()->route('ecosystems.installation-tokens.index', $ecosystem)
            ->with('success', 'Installation token deleted successfully.');
    }
}
