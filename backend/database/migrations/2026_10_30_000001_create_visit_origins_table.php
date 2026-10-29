<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Atribución de origen: una fila por (visitante anónimo, día, utm, página de entrada) con el número de
        // sesiones. Sin IP, user-agent ni referrer; los utm vienen de links propios (ver docs/analytics.md).
        Schema::create('visit_origins', function (Blueprint $table) {
            $table->id();
            $table->char('visitor_hash', 64);
            $table->date('visited_on');
            $table->string('source', 50)->default('');
            $table->string('medium', 50)->default('');
            $table->string('campaign', 50)->default('');
            $table->string('entry_path', 120);
            $table->unsignedInteger('sessions')->default(1);
            $table->timestamps();

            $table->unique(['visitor_hash', 'visited_on', 'source', 'medium', 'campaign', 'entry_path'], 'visit_origins_unique');
            $table->index('visited_on');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_origins');
    }
};
