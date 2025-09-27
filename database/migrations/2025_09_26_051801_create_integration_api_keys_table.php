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
        Schema::create('integration_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->onDelete('cascade');
            $table->string('key', 64)->unique();
            $table->string('name')->nullable(); // Human readable name for the key
            $table->boolean('active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->json('scopes')->nullable(); // What this key can access
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_api_keys');
    }
};
