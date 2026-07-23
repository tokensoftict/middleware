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
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_api_key_id')->constrained('client_api_keys')->cascadeOnDelete();

            // Snapshot of the URL at time of delivery
            $table->string('client_webhook_url');

            // The processed/normalized payload sent to the client
            $table->json('delivery_payload');

            // Client's HTTP response
            $table->unsignedSmallInteger('response_status')->nullable();
            $table->json('response_body')->nullable();

            // Retry tracking
            $table->unsignedSmallInteger('attempts')->default(1);
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->enum('status', ['pending', 'delivered', 'failed'])->default('pending');

            $table->timestamps();

            $table->index(['webhook_event_id', 'status']);
            $table->index(['client_api_key_id', 'status']);
            $table->index('next_retry_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};
