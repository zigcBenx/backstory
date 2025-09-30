<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ecosystem extends Model
{
    protected $fillable = [
        'name',
        'description',
        'user_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function activityTypes(): HasMany
    {
        return $this->hasMany(ActivityType::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(Integration::class);
    }

    public function installationTokens(): HasMany
    {
        return $this->hasMany(InstallationToken::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($ecosystem) {
            $ecosystem->users()->attach($ecosystem->user_id, ['role' => 'owner']);

            $defaultTypes = [
                ['name' => 'Server Changes', 'color' => '#3b82f6', 'icon' => 'server'],
                ['name' => 'Deployments', 'color' => '#10b981', 'icon' => 'rocket'],
                ['name' => 'Permission Changes', 'color' => '#f59e0b', 'icon' => 'shield'],
                ['name' => 'Database Changes', 'color' => '#ef4444', 'icon' => 'database'],
            ];

            foreach ($defaultTypes as $type) {
                $ecosystem->activityTypes()->create($type);
            }
        });
    }
}
