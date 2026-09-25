<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    /**
     * Powers the counselor's "Student List" (Fig. 15). Each entry includes the
     * student's most recent stress classification so the list can be sorted/flagged
     * without a second request per row.
     */
    public function index(Request $request)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $students = User::where('role', 'student')
            ->with(['stressClassifications' => fn ($q) => $q->orderByDesc('classified_at')->limit(1)])
            ->get(['id', 'patient_code', 'course', 'college', 'age']);

        return response()->json($students);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $data = $request->validate([
            'course' => ['required', 'string', 'max:255'],
            'college' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:10'],
        ]);

        $patientCode = 'STU-' . strtoupper(Str::random(6));
        $student = User::create([
            'name' => '',
            'email' => "student+{$patientCode}@generated.local",
            'password' => bcrypt(Str::random(24)),
            'role' => 'student',
            'patient_code' => $patientCode,
            'course' => $data['course'],
            'college' => $data['college'],
            'age' => $data['age'],
        ]);

        return response()->json($student, 201);
    }

    public function show(Request $request, int $studentId)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $student = User::where('role', 'student')
            ->with([
                'stressClassifications' => fn ($q) => $q->orderByDesc('classified_at')->limit(20),
                'notesReceived' => fn ($q) => $q->orderByDesc('created_at')->limit(20),
                'counselingSessionsAsStudent' => fn ($q) => $q->orderByDesc('scheduled_at')->limit(10),
            ])
            ->findOrFail($studentId, ['id', 'patient_code', 'course', 'college', 'age']);

        return response()->json($student);
    }
}
