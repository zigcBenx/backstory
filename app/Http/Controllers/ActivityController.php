<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Ecosystem;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    use AuthorizesRequests;
    public function store(Request $request, Ecosystem $ecosystem)
    {
        $this->authorize('update', $ecosystem);

        $validated = $request->validate([
            'activity_type_id' => 'required|exists:activity_types,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'user_name' => 'required|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        $validated['ecosystem_id'] = $ecosystem->id;

        $ecosystem->activities()->create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Activity $activity)
    {
        $this->authorize('update', $activity->ecosystem);

        $validated = $request->validate([
            'activity_type_id' => 'required|exists:activity_types,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'user_name' => 'required|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        $activity->update($validated);

        return redirect()->back();
    }

    public function destroy(Activity $activity)
    {
        $this->authorize('update', $activity->ecosystem);

        $activity->delete();

        return redirect()->back();
    }
}
