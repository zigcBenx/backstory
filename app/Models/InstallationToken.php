<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Carbon\Carbon;

class InstallationToken extends Model
{
    protected $fillable = [
        'ecosystem_id',
        'created_by_user_id',
        'integration_id',
        'name',
        'integration_type',
        'expires_at',
        'used_at',
        'metadata',
        'active',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'metadata' => 'array',
        'active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($token) {
            if (empty($token->token)) {
                $token->token = 'bsi_' . Str::random(60); // BackStory Installation token
            }

            // Default expiry: 24 hours
            if (empty($token->expires_at)) {
                $token->expires_at = Carbon::now()->addHours(24);
            }
        });
    }

    public function ecosystem(): BelongsTo
    {
        return $this->belongsTo(Ecosystem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function isValid(): bool
    {
        return $this->active
            && $this->expires_at->isFuture()
            && is_null($this->used_at); // Single use token
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    public function markAsUsed(): void
    {
        $this->update([
            'used_at' => now(),
            'active' => false, // Deactivate after use
        ]);
    }

    public function revoke(): void
    {
        $this->update(['active' => false]);
    }

    public function getStatusAttribute(): string
    {
        if (!$this->active) {
            return $this->isUsed() ? 'used' : 'revoked';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        return 'active';
    }

    // Scope for finding valid tokens
    public function scopeValid($query)
    {
        return $query->where('active', true)
                    ->where('expires_at', '>', now())
                    ->whereNull('used_at');
    }
}
