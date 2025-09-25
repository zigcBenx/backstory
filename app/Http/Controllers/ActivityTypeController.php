<?php

namespace App\Http\Controllers;

use App\Models\ActivityType;
use App\Models\Ecosystem;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityTypeController extends Controller
{
    use AuthorizesRequests;
    public function index(Ecosystem $ecosystem)
    {
        $this->authorize('update', $ecosystem);

        $ecosystem->load('activityTypes');

        return Inertia::render('ManageActivityTypes', [
            'ecosystem' => $ecosystem,
        ]);
    }

    public function store(Request $request, Ecosystem $ecosystem)
    {
        $this->authorize('update', $ecosystem);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
        ]);

        $validated['ecosystem_id'] = $ecosystem->id;

        $ecosystem->activityTypes()->create($validated);

        return redirect()->back();
    }

    public function update(Request $request, ActivityType $activityType)
    {
        $this->authorize('update', $activityType->ecosystem);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'required|string|size:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'icon' => 'nullable|string|max:50',
        ]);

        $activityType->update($validated);

        return redirect()->back();
    }

    public function destroy(ActivityType $activityType)
    {
        $this->authorize('update', $activityType->ecosystem);

        if ($activityType->activities()->count() > 0) {
            return redirect()->back()->withErrors([
                'message' => 'Cannot delete activity type with existing activities.'
            ]);
        }

        $activityType->delete();

        return redirect()->back();
    }
}
