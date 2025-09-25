<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function ecosystem(): BelongsTo
    {
        return $this->belongsTo(Ecosystem::class);
    }
}
