<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SensorReading;
use Illuminate\Http\Request;

class SensorReadingController extends Controller
{
    /**
     * Called by the ESP32-S3 firmware (or the Connect Device flow relaying from BLE/WiFi).
     * Kept deliberately dumb right now — just stores raw values. The heavy lifting
     * (Butterworth filtering, feature extraction, SVM) will later happen in the
     * Python ml-service, not here and not on the microcontroller.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'session_id' => ['nullable', 'exists:counseling_sessions,id'],
            'ppg_raw' => ['nullable', 'numeric'],
            'gsr_raw' => ['nullable', 'numeric'],
            'heart_rate_bpm' => ['nullable', 'numeric'],
            'phase' => ['required', 'in:resting,interaction,post_interaction'],
            'recorded_at' => ['required', 'date'],
        ]);

        $reading = SensorReading::create($data);

        return response()->json($reading, 201);
    }

    /**
     * Batched ingest — ESP32 buffers a few seconds of samples and sends them as an array,
     * instead of one HTTP request per sample (kinder to the microcontroller's radio/battery).
     */
    public function storeBatch(Request $request)
    {
        $data = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'session_id' => ['nullable', 'exists:counseling_sessions,id'],
            'phase' => ['required', 'in:resting,interaction,post_interaction'],
            'readings' => ['required', 'array', 'min:1'],
            'readings.*.ppg_raw' => ['nullable', 'numeric'],
            'readings.*.gsr_raw' => ['nullable', 'numeric'],
            'readings.*.heart_rate_bpm' => ['nullable', 'numeric'],
            'readings.*.recorded_at' => ['required', 'date'],
        ]);

        $rows = collect($data['readings'])->map(fn ($r) => [
            'student_id' => $data['student_id'],
            'session_id' => $data['session_id'] ?? null,
            'phase' => $data['phase'],
            'ppg_raw' => $r['ppg_raw'] ?? null,
            'gsr_raw' => $r['gsr_raw'] ?? null,
            'heart_rate_bpm' => $r['heart_rate_bpm'] ?? null,
            'recorded_at' => $r['recorded_at'],
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        SensorReading::insert($rows);

        return response()->json(['inserted' => count($rows)], 201);
    }

    public function forStudent(Request $request, int $studentId)
    {
        $this->authorizeViewer($request, $studentId);

        $readings = SensorReading::where('student_id', $studentId)
            ->orderByDesc('recorded_at')
            ->limit(500)
            ->get();

        return response()->json($readings);
    }

    private function authorizeViewer(Request $request, int $studentId): void
    {
        $user = $request->user();
        abort_unless($user->isCounselor() || $user->id === $studentId, 403);
    }
}
