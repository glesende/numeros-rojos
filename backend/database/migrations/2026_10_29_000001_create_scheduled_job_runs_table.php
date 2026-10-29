<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_job_runs', function (Blueprint $table) {
            $table->id();
            $table->string('command', 100);
            $table->string('status', 10); // running | success | failed
            $table->dateTime('started_at');
            $table->dateTime('finished_at')->nullable();
            $table->smallInteger('exit_code')->nullable();
            $table->timestamps();

            $table->index(['command', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_job_runs');
    }
};
