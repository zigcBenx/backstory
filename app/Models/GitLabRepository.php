<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitLabRepository extends Model
{
    protected $fillable = [
        'integration_id',
        'project_id',
        'name',
        'full_name',
        'url',
        'default_branch',
        'production_branches',
        'staging_keywords',
        'last_release_tag',
        'last_release_at',
        'track_deployments_only',
        'active',
    ];

    protected $casts = [
        'production_branches' => 'array',
        'staging_keywords' => 'array',
        'last_release_at' => 'datetime',
        'track_deployments_only' => 'boolean',
        'active' => 'boolean',
    ];

    public function integration(): BelongsTo
    {
        return $this->belongsTo(Integration::class);
    }

    /**
     * Check if a release tag indicates a production deployment
     */
    public function isProductionRelease(string $tag, ?string $branch = null): bool
    {
        // Check for staging keywords in tag
        $stagingKeywords = $this->staging_keywords ?? ['beta', 'rc', 'staging', 'dev', 'alpha'];
        foreach ($stagingKeywords as $keyword) {
            if (str_contains(strtolower($tag), strtolower($keyword))) {
                return false;
            }
        }

        // If tracking deployments only, require branch check
        if ($this->track_deployments_only && $branch) {
            $productionBranches = $this->production_branches ?? ['main', 'master', 'production'];
            return in_array($branch, $productionBranches);
        }

        // Default: assume production if no staging keywords found
        return true;
    }

    /**
     * Get the repository's GitLab web URL
     */
    public function getWebUrlAttribute(): string
    {
        return $this->url;
    }

    /**
     * Get the latest release URL
     */
    public function getReleaseUrlAttribute(): string
    {
        return $this->url . '/-/releases/' . $this->last_release_tag;
    }
}
