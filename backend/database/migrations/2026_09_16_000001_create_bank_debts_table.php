<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_debts', function (Blueprint $table) {
            $table->id();
            $table->string('identifier');
            $table->string('period', 6);
            $table->string('entity');
            $table->decimal('amount', 18, 2);
            $table->unsignedTinyInteger('situation');
            $table->boolean('under_review')->default(false);
            $table->boolean('legal_proceeding')->default(false);
            $table->timestamps();

            $table->unique(['identifier', 'period', 'entity']);
            $table->index('period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_debts');
    }
};
