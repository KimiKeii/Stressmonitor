<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('counselor_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('counselor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('counseling_sessions')->nullOnDelete();
            $table->text('note');
            $table->string('recommendation')->nullable(); // shown on "Send Recommendation" action (Fig. 15)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('counselor_notes');
    }
};
