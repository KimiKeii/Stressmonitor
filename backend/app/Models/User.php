<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'patient_code',
        'course',
        'college',
        'age',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'age' => 'integer',
        ];
    }

    public function isCounselor(): bool
    {
        return $this->role === 'counselor';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    // Only meaningful for students
    public function sensorReadings()
    {
        return $this->hasMany(SensorReading::class, 'student_id');
    }

    public function stressClassifications()
    {
        return $this->hasMany(StressClassification::class, 'student_id');
    }

    public function counselingSessionsAsStudent()
    {
        return $this->hasMany(CounselingSession::class, 'student_id');
    }

    public function counselingSessionsAsCounselor()
    {
        return $this->hasMany(CounselingSession::class, 'counselor_id');
    }

    public function notesReceived()
    {
        return $this->hasMany(CounselorNote::class, 'student_id');
    }

    public function notesWritten()
    {
        return $this->hasMany(CounselorNote::class, 'counselor_id');
    }
}
