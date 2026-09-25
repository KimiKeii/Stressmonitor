<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 'student' or 'counselor' — drives which dashboard the React app renders
            $table->enum('role', ['student', 'counselor'])->default('student')->after('email');
            $table->string('patient_code')->nullable()->unique()->after('role'); // anonymized ID, not real name, per data-privacy scope in Ch.3
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'patient_code']);
        });
    }
};
