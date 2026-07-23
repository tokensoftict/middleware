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
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_api_key_id')->nullable()->constrained()->nullOnDelete();
            // The event type — resolved from URL path or request body
            $table->string('event_type');

            // Which URL path was hit (supports multiple inbound URLs per service)
            $table->string('inbound_url_path');

            // Audit fields
            $table->string('source_ip', 45)->nullable();
            $table->json('raw_headers')->nullable();
            $table->json('raw_payload');

            // Adapter processing result
            $table->json('webhook_response')->nullable();

            // Lifecycle status
            $table->enum('status', ['received', 'processed', 'failed', 'ignored'])->default('received');

            $table->timestamps();

            $table->index(['service_id', 'event_type']);
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
