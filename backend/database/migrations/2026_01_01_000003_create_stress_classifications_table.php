<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stress_classifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('counseling_sessions')->nullOnDelete();

            $table->enum('stress_level', ['non_stress', 'mild_stress', 'stress'])->default('non_stress');

            // Extracted feature summary (RMSSD, mean SCL, etc.) — kept as JSON so the
            // eventual Python ML service can add/change features without a new migration.
            $table->json('feature_vector')->nullable();

            // Where this label came from: 'rule_based' placeholder now, 'svm' once the
            // ml-service is wired in. Keeps the audit trail your Ch.3 methodology calls for.
            $table->string('source')->default('rule_based');

            $table->timestamp('classified_at');
            $table->timestamps();

            $table->index(['student_id', 'classified_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stress_classifications');
    }
};
