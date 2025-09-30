<?php

use App\Http\Controllers\Api\IntegrationWebhookController;
use App\Http\Controllers\Api\GitLabWebhookController;
use Illuminate\Support\Facades\Route;

// Integration webhook endpoints (no auth middleware - uses API key)
Route::prefix('integrations')->group(function () {
    Route::post('heartbeat', [IntegrationWebhookController::class, 'heartbeat'])->name('api.integrations.heartbeat');
    Route::post('file-change', [IntegrationWebhookController::class, 'fileChange'])->name('api.integrations.file-change');

    // Installation token exchange (public endpoint)
    Route::post('install', [IntegrationWebhookController::class, 'install'])->name('api.integrations.install');
});

// GitLab webhook endpoint (no auth - uses webhook token validation)
Route::post('gitlab/webhook', [GitLabWebhookController::class, 'handle'])->name('api.gitlab.webhook');