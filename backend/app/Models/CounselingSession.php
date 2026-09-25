<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CounselingSession extends Model
{
    protected $fillable = [
        'student_id',
        'counselor_id',
        'scheduled_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function sensorReadings()
    {
        return $this->hasMany(SensorReading::class, 'session_id');
    }

    public function stressClassifications()
    {
        return $this->hasMany(StressClassification::class, 'session_id');
    }

    public function notes()
    {
        return $this->hasMany(CounselorNote::class, 'session_id');
    }
}
