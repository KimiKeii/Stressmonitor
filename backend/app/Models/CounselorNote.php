<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CounselorNote extends Model
{
    protected $fillable = [
        'student_id',
        'counselor_id',
        'session_id',
        'note',
        'recommendation',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function session()
    {
        return $this->belongsTo(CounselingSession::class, 'session_id');
    }
}
