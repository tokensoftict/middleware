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
        Schema::create('client_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('api_key')->unique();
            $table->string('api_secret');
            $table->string('permissions')->default('[]');
            $table->unsignedInteger('rate_limit')->default(60); // requests per minute
            $table->string('status')->default('active'); // active, suspended, blocked
            $table->string('environment')->default('sandbox'); // sandbox, production
            $table->text('credentials')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_api_keys');
    }
};
