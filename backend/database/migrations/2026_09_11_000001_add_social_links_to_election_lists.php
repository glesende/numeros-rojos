<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('election_lists', function (Blueprint $table) {
            $table->string('twitter_url', 500)->nullable()->after('source_url');
            $table->string('instagram_url', 500)->nullable()->after('twitter_url');
        });
    }

    public function down(): void
    {
        Schema::table('election_lists', function (Blueprint $table) {
            $table->dropColumn(['twitter_url', 'instagram_url']);
        });
    }
};
