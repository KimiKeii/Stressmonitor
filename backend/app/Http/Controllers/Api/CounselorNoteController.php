<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CounselorNote;
use Illuminate\Http\Request;

class CounselorNoteController extends Controller
{
    public function store(Request $request)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $data = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'session_id' => ['nullable', 'exists:counseling_sessions,id'],
            'note' => ['required', 'string'],
            'recommendation' => ['nullable', 'string', 'max:255'],
        ]);

        $data['counselor_id'] = $request->user()->id;

        $note = CounselorNote::create($data);

        return response()->json($note, 201);
    }

    public function forStudent(Request $request, int $studentId)
    {
        abort_unless($request->user()->isCounselor(), 403);

        $notes = CounselorNote::where('student_id', $studentId)
            ->with('counselor:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($notes);
    }
}
