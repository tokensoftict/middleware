<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->boolean('has_webhook')->default(false)->after('rate_limit');
            $table->unsignedInteger('webhook_retries_per_day')->default(3)->after('has_webhook');
            $table->unsignedInteger('webhook_retry_days')->default(1)->after('webhook_retries_per_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['has_webhook', 'webhook_retries_per_day', 'webhook_retry_days']);
        });
    }
};
