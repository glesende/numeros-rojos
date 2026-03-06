<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo');
            $table->date('fecha_firma');
            $table->date('fecha_caducidad');
            $table->decimal('porcentaje_pase_club', 5, 2);
            $table->decimal('salario_estimado', 15, 2)->nullable();
            $table->enum('moneda', ['ARS', 'USD'])->nullable();
            $table->boolean('oficial')->default(false);
            $table->enum('confidence_level', ['high', 'medium', 'low'])->default('medium');
            $table->json('clausulas')->nullable();
            $table->json('links')->nullable();
            $table->timestamps();

            $table->index('nombre_completo');
            $table->index('fecha_firma');
            $table->index('oficial');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
