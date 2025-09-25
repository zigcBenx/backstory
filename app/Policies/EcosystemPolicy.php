<?php

namespace App\Policies;

use App\Models\Ecosystem;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class EcosystemPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ecosystem $ecosystem): bool
    {
        return $ecosystem->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Ecosystem $ecosystem): bool
    {
        return $ecosystem->users()
            ->where('users.id', $user->id)
            ->wherePivot('role', 'owner')
            ->exists();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ecosystem $ecosystem): bool
    {
        return $ecosystem->user_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Ecosystem $ecosystem): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Ecosystem $ecosystem): bool
    {
        return false;
    }
}
