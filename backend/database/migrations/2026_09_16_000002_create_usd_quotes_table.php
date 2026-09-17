<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usd_quotes', function (Blueprint $table) {
            $table->id();
            $table->date('quote_date')->unique();
            $table->decimal('rate', 18, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usd_quotes');
    }
};
