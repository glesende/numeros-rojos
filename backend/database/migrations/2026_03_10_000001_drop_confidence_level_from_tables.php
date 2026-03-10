<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('economy_records', function (Blueprint $table) {
            $table->dropColumn('confidence_level');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('confidence_level');
        });
    }

    public function down(): void
    {
        Schema::table('economy_records', function (Blueprint $table) {
            $table->enum('confidence_level', ['high', 'medium', 'low'])->default('medium');
        });

        Schema::table('contracts', function (Blueprint $table) {
            $table->enum('confidence_level', ['high', 'medium', 'low'])->default('medium');
        });
    }
};
