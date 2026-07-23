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
        Schema::create('api_gateway_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_api_key_id')->nullable()->constrained()->nullOnDelete();
            $table->string('endpoint_called');
            $table->string('request_method');
            $table->json('request_payload')->nullable();
            $table->json('request_headers')->nullable();
            $table->json('service_headers')->nullable();
            $table->json('response_payload')->nullable();
            $table->unsignedInteger('http_status_code');
            $table->unsignedInteger('execution_time_ms');
            $table->timestamps();

            // Add indexes for searching/filtering
            $table->index(['client_id', 'service_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_gateway_logs');
    }
};
