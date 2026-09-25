<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CounselorNoteController;
use App\Http\Controllers\Api\SensorReadingController;
use App\Http\Controllers\Api\StressClassificationController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

// --- Public (Login screen only) ---
Route::post('/login', [AuthController::class, 'login']);

// --- ESP32 firmware ingest (no user session — device posts with a shared device key
// via middleware you add later, e.g. a simple header check, once you're past prototyping) ---
Route::post('/sensor-readings', [SensorReadingController::class, 'store']);
Route::post('/sensor-readings/batch', [SensorReadingController::class, 'storeBatch']);

// --- Authenticated app routes (Sanctum token from login) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Student dashboard (Figs. 16-17)
    Route::get('/students/{student}/sensor-readings', [SensorReadingController::class, 'forStudent']);
    Route::get('/students/{student}/stress/latest', [StressClassificationController::class, 'latestForStudent']);
    Route::get('/students/{student}/stress/history', [StressClassificationController::class, 'historyForStudent']);
    Route::get('/students/{student}/notes', [CounselorNoteController::class, 'forStudent']);

    // Classification trigger — call this after a batch of readings comes in.
    // Later this can be wired to a queued job so it runs automatically.
    Route::post('/stress/classify', [StressClassificationController::class, 'classify']);

    // Counselor dashboard (Fig. 15)
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    Route::get('/students/{student}', [StudentController::class, 'show']);
    Route::post('/notes', [CounselorNoteController::class, 'store']);
});
