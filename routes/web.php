<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityTypeController;
use App\Http\Controllers\AIAnalysisController;
use App\Http\Controllers\EcosystemController;
use App\Http\Controllers\InstallationTokenController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\PublicInstallController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Public installation script endpoint (NO AUTHENTICATION - SAFE!)
Route::get('install.sh', [PublicInstallController::class, 'installScript'])
    ->name('install.script');

// Legacy script endpoint (will be deprecated)
Route::get('install/server-monitor/{integration}', [IntegrationController::class, 'getScript'])
    ->name('integrations.get-script');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [EcosystemController::class, 'index'])->name('dashboard');

    Route::resource('ecosystems', EcosystemController::class)->except(['index', 'create', 'edit']);

    Route::post('ecosystems/{ecosystem}/activities', [ActivityController::class, 'store'])
        ->name('activities.store');
    Route::put('activities/{activity}', [ActivityController::class, 'update'])
        ->name('activities.update');
    Route::delete('activities/{activity}', [ActivityController::class, 'destroy'])
        ->name('activities.destroy');

    // AI Analysis routes
    Route::post('ecosystems/{ecosystem}/ai-analysis/incident', [AIAnalysisController::class, 'analyzeIncident'])
        ->name('ai-analysis.incident');

    Route::get('ecosystems/{ecosystem}/activity-types', [ActivityTypeController::class, 'index'])
        ->name('activity-types.index');
    Route::post('ecosystems/{ecosystem}/activity-types', [ActivityTypeController::class, 'store'])
        ->name('activity-types.store');
    Route::put('activity-types/{activityType}', [ActivityTypeController::class, 'update'])
        ->name('activity-types.update');
    Route::delete('activity-types/{activityType}', [ActivityTypeController::class, 'destroy'])
        ->name('activity-types.destroy');

    Route::get('ecosystems/{ecosystem}/integrations', [IntegrationController::class, 'index'])
        ->name('integrations.index');
    Route::post('ecosystems/{ecosystem}/integrations', [IntegrationController::class, 'store'])
        ->name('integrations.store');
    Route::put('integrations/{integration}', [IntegrationController::class, 'update'])
        ->name('integrations.update');
    Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])
        ->name('integrations.destroy');
    Route::get('integrations/{integration}/download-script', [IntegrationController::class, 'downloadScript'])
        ->name('integrations.download-script');
    Route::get('integrations/{integration}/install-command', [IntegrationController::class, 'getInstallCommand'])
        ->name('integrations.install-command');

    // Installation Token routes
    Route::get('ecosystems/{ecosystem}/installation-tokens', [InstallationTokenController::class, 'index'])
        ->name('ecosystems.installation-tokens.index');
    Route::get('ecosystems/{ecosystem}/installation-tokens/create', [InstallationTokenController::class, 'create'])
        ->name('ecosystems.installation-tokens.create');
    Route::post('ecosystems/{ecosystem}/installation-tokens', [InstallationTokenController::class, 'store'])
        ->name('ecosystems.installation-tokens.store');
    Route::get('ecosystems/{ecosystem}/installation-tokens/{token}', [InstallationTokenController::class, 'show'])
        ->name('ecosystems.installation-tokens.show');
    Route::post('ecosystems/{ecosystem}/installation-tokens/{token}/revoke', [InstallationTokenController::class, 'revoke'])
        ->name('ecosystems.installation-tokens.revoke');
    Route::delete('ecosystems/{ecosystem}/installation-tokens/{token}', [InstallationTokenController::class, 'destroy'])
        ->name('ecosystems.installation-tokens.destroy');

    Route::prefix('integrations/{integration}/gitlab')->group(function () {
        Route::post('test-connection', [IntegrationController::class, 'testGitLabConnection']);
        Route::get('repositories', [IntegrationController::class, 'getGitLabRepositories']);
        Route::get('repositories/search', [IntegrationController::class, 'searchGitLabRepositories']);
        Route::get('tracked-repositories', [IntegrationController::class, 'getTrackedGitLabRepositories']);
        Route::post('repositories', [IntegrationController::class, 'addGitLabRepository']);
        Route::delete('repositories/{repository}', [IntegrationController::class, 'removeGitLabRepository']);
    });
});


require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
