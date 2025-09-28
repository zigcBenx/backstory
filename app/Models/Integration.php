<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Integration extends Model
{
    protected $fillable = [
        'ecosystem_id',
        'name',
        'type',
        'description',
        'icon',
        'category',
        'connected',
        'config',
        'last_sync_at',
    ];

    protected $casts = [
        'connected' => 'boolean',
        'config' => 'array',
        'last_sync_at' => 'datetime',
    ];

    protected $appends = [
        'activity_status',
    ];

    public function ecosystem(): BelongsTo
    {
        return $this->belongsTo(Ecosystem::class);
    }

    public function apiKeys(): HasMany
    {
        return $this->hasMany(IntegrationApiKey::class);
    }

    public function gitLabRepositories(): HasMany
    {
        return $this->hasMany(GitLabRepository::class);
    }

    public function createApiKey(string $name = null): IntegrationApiKey
    {
        return $this->apiKeys()->create([
            'name' => $name ?? 'Default Key',
        ]);
    }

    /**
     * Check if integration is currently active based on recent heartbeat
     */
    public function isActive(): bool
    {
        // Only check for server monitor integrations
        if ($this->type !== 'server-monitor') {
            return $this->connected;
        }

        // No heartbeat received yet
        if (!$this->last_sync_at) {
            return false;
        }

        // Active if heartbeat received within last 2 minutes
        return $this->last_sync_at->gt(now()->subMinutes(2));
    }

    /**
     * Get the activity status for display
     */
    public function getActivityStatusAttribute(): string
    {
        if ($this->type !== 'server-monitor') {
            return $this->connected ? 'connected' : 'disconnected';
        }

        return $this->isActive() ? 'active' : 'inactive';
    }
}
