<?php

use App\Http\Controllers\Api\IntegrationWebhookController;
use Illuminate\Support\Facades\Route;

// Integration webhook endpoints (no auth middleware - uses API key)
Route::prefix('integrations')->group(function () {
    Route::post('heartbeat', [IntegrationWebhookController::class, 'heartbeat'])->name('api.integrations.heartbeat');
    Route::post('file-change', [IntegrationWebhookController::class, 'fileChange'])->name('api.integrations.file-change');
});