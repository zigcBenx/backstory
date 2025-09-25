<?php

namespace App\Http\Controllers;

use App\Models\Ecosystem;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EcosystemController extends Controller
{
    use AuthorizesRequests;
    public function index(): Response
    {
        $ecosystems = auth()->user()->ecosystems()->with('activityTypes', 'activities.activityType')->get();

        return Inertia::render('Dashboard', [
            'ecosystems' => $ecosystems,
        ]);
    }

    public function show(Ecosystem $ecosystem): Response
    {
        $this->authorize('view', $ecosystem);

        $ecosystem->load([
            'activities' => function ($query) {
                $query->with('activityType')->orderBy('created_at', 'desc');
            },
            'activityTypes',
            'users'
        ]);

        return Inertia::render('EcosystemShow', [
            'ecosystem' => $ecosystem,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $ecosystem = auth()->user()->ownedEcosystems()->create($validated);

        return redirect()->route('ecosystems.show', $ecosystem);
    }

    public function update(Request $request, Ecosystem $ecosystem)
    {
        $this->authorize('update', $ecosystem);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $ecosystem->update($validated);

        return redirect()->back();
    }

    public function destroy(Ecosystem $ecosystem)
    {
        $this->authorize('delete', $ecosystem);

        $ecosystem->delete();

        return redirect()->route('dashboard');
    }
}
