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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_name')->nullable();
            $table->string('contact_email')->unique();
            $table->string('phone')->nullable();
            $table->string('description', 150)->nullable();
            $table->string('logo', 100)->nullable();
            $table->enum('status', ['active', 'suspended', 'blocked'])->default('active');
            $table->unsignedInteger('rate_limit')->default(1000);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
