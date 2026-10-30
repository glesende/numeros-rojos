<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Tarea #120: la única fuente de analítica es GA4. Se eliminan las métricas propias (#89/#96).
// El down() recrea la estructura (no los datos: se recuperan del dump que deja el deploy).
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('visit_origins');
        Schema::dropIfExists('page_views');
    }

    public function down(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('section', 30);
            $table->char('visitor_hash', 64);
            $table->date('viewed_on');
            $table->unsignedInteger('views')->default(1);
            $table->timestamps();

            $table->unique(['section', 'visitor_hash', 'viewed_on']);
            $table->index('viewed_on');
        });

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
};
