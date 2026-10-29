<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Una fila por (sección, visitante anónimo, día). visitor_hash = HMAC del id aleatorio del navegador:
        // no hay IP, user-agent ni ningún dato personal.
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
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
