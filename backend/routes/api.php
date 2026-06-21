<?php

use App\Http\Controllers\Api\WorkflowController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', function () {
        return request()->user();
    });

    Route::apiResource('workflows', WorkflowController::class);

    Route::post('workflows/{workflow}/validate', [WorkflowController::class, 'validate'])
        ->name('workflows.validate');

    Route::post('workflows/{workflow}/execute', [WorkflowController::class, 'execute'])
        ->name('workflows.execute');
});
