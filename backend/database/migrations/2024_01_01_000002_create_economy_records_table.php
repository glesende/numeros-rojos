<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('economy_records', function (Blueprint $table) {
            $table->id();
            $table->text('descripcion');
            $table->enum('tipo', ['cobro', 'pago']);
            $table->decimal('monto', 15, 2);
            $table->enum('moneda', ['ARS', 'USD'])->default('ARS');
            $table->date('fecha');
            $table->boolean('oficial')->default(false);
            $table->json('links')->nullable();
            $table->timestamps();

            $table->index('tipo');
            $table->index('fecha');
            $table->index('oficial');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('economy_records');
    }
};
