<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('counseling_sessions')->nullOnDelete();

            // Raw values as sent by the ESP32-S3 firmware (pre-filtering)
            $table->float('ppg_raw')->nullable();       // MAX30102 photoplethysmogram sample
            $table->float('gsr_raw')->nullable();        // Grove GSR sample
            $table->float('heart_rate_bpm')->nullable(); // computed on-device (Pan-Tompkins) if firmware sends it

            $table->enum('phase', ['resting', 'interaction', 'post_interaction'])->default('resting');
            $table->timestamp('recorded_at'); // device timestamp, not just DB insert time

            $table->timestamps();

            $table->index(['student_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_readings');
    }
};
