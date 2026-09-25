<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SensorReading extends Model
{
    protected $fillable = [
        'student_id',
        'session_id',
        'ppg_raw',
        'gsr_raw',
        'heart_rate_bpm',
        'phase',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function session()
    {
        return $this->belongsTo(CounselingSession::class, 'session_id');
    }
}
