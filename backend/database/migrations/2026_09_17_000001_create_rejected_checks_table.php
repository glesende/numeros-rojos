<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rejected_checks', function (Blueprint $table) {
            $table->id();
            $table->string('identifier');
            $table->unsignedBigInteger('check_number');
            $table->unsignedInteger('entity');
            $table->string('cause');
            $table->date('rejection_date');
            $table->decimal('amount', 18, 2);
            $table->date('payment_date')->nullable();
            $table->date('fine_payment_date')->nullable();
            $table->string('fine_status')->nullable();
            $table->boolean('personal_account')->default(false);
            $table->string('legal_entity_name')->nullable();
            $table->boolean('under_review')->default(false);
            $table->boolean('legal_proceeding')->default(false);
            $table->timestamps();

            $table->unique(['identifier', 'check_number', 'entity']);
            $table->index('cause');
            $table->index('rejection_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rejected_checks');
    }
};
