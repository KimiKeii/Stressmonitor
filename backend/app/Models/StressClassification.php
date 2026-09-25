<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StressClassification extends Model
{
    protected $fillable = [
        'student_id',
        'session_id',
        'stress_level',
        'feature_vector',
        'source',
        'classified_at',
    ];

    protected $casts = [
        'feature_vector' => 'array',
        'classified_at' => 'datetime',
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
