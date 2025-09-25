<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityTypeController;
use App\Http\Controllers\EcosystemController;
use App\Http\Controllers\IntegrationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [EcosystemController::class, 'index'])->name('dashboard');

    Route::resource('ecosystems', EcosystemController::class)->except(['index', 'create', 'edit']);

    Route::post('ecosystems/{ecosystem}/activities', [ActivityController::class, 'store'])
        ->name('activities.store');
    Route::put('activities/{activity}', [ActivityController::class, 'update'])
        ->name('activities.update');
    Route::delete('activities/{activity}', [ActivityController::class, 'destroy'])
        ->name('activities.destroy');

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
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
