<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class IntegrationApiKey extends Model
{
    protected $fillable = [
        'integration_id',
        'key',
        'name',
        'active',
        'last_used_at',
        'scopes',
    ];

    protected $casts = [
        'active' => 'boolean',
        'last_used_at' => 'datetime',
        'scopes' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($apiKey) {
            if (empty($apiKey->key)) {
                $apiKey->key = 'bs_' . Str::random(60);
            }
        });
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
