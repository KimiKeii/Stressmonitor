<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SensorReading;
use App\Models\StressClassification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class StressClassificationController extends Controller
{
    /**
     * Classifies a student's most recent readings.
     *
     * Right now this uses a simple threshold rule so the rest of the app (dashboards,
     * alerts, history charts) can be built and demoed without the SVM being ready.
     * When ml-service exists, replace the body of classify() with an HTTP call —
     * everything else (routes, React, DB schema) stays the same.
     */
    public function classify(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'session_id' => ['nullable', 'exists:counseling_sessions,id'],
        ]);

        $recent = SensorReading::where('student_id', $data['student_id'])
            ->orderByDesc('recorded_at')
            ->limit(50)
            ->get();

        if ($recent->isEmpty()) {
            return response()->json(['message' => 'No recent sensor readings for this student.'], 422);
        }

        [$stressLevel, $features] = config('services.ml_service.url')
            ? $this->classifyViaMlService($recent)
            : $this->classifyWithRuleBasedStub($recent);

        $classification = StressClassification::create([
            'student_id' => $data['student_id'],
            'session_id' => $data['session_id'] ?? null,
            'stress_level' => $stressLevel,
            'feature_vector' => $features,
            'source' => config('services.ml_service.url') ? 'svm' : 'rule_based',
            'classified_at' => now(),
        ]);

        return response()->json($classification, 201);
    }

    /**
     * Placeholder logic: flags stress from elevated GSR + suppressed HRV proxy (heart rate
     * far above the session's own resting-phase baseline). This is NOT the SVM from Ch.3 —
     * it only exists so the dashboards have something real to render before the model is ready.
     */
    private function classifyWithRuleBasedStub($readings): array
    {
        $avgGsr = $readings->avg('gsr_raw') ?? 0;
        $avgHr = $readings->avg('heart_rate_bpm') ?? 0;

        $level = 'non_stress';
        if ($avgGsr > 0.7 && $avgHr > 100) {
            $level = 'stress';
        } elseif ($avgGsr > 0.5 || $avgHr > 90) {
            $level = 'mild_stress';
        }

        return [$level, [
            'avg_gsr' => round($avgGsr, 3),
            'avg_heart_rate' => round($avgHr, 1),
            'sample_count' => $readings->count(),
        ]];
    }

    /**
     * Future seam: call the Python ml-service (FastAPI) that runs the Butterworth filter,
     * NeuroKit2/cvxEDA feature extraction, and the trained SVM (RBF, OvO, per Ch.3).
     * Set ML_SERVICE_URL in .env to activate this path automatically.
     */
    private function classifyViaMlService($readings): array
    {
        $response = Http::timeout(5)->post(config('services.ml_service.url') . '/classify', [
            'readings' => $readings->map(fn ($r) => [
                'ppg_raw' => $r->ppg_raw,
                'gsr_raw' => $r->gsr_raw,
                'heart_rate_bpm' => $r->heart_rate_bpm,
                'recorded_at' => $r->recorded_at,
            ])->values(),
        ]);

        $body = $response->json();

        return [$body['stress_level'] ?? 'non_stress', $body['features'] ?? null];
    }

    public function latestForStudent(Request $request, int $studentId)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $latest = StressClassification::where('student_id', $studentId)
            ->orderByDesc('classified_at')
            ->first();

        return response()->json($latest);
    }

    public function historyForStudent(Request $request, int $studentId)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $history = StressClassification::where('student_id', $studentId)
            ->orderByDesc('classified_at')
            ->limit(200)
            ->get();

        return response()->json($history);
    }
}
