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
        Schema::create('installation_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique(); // UUID format
            $table->foreignId('ecosystem_id')->constrained()->onDelete('cascade');
            $table->foreignId('created_by_user_id')->constrained('users')->onDelete('cascade');
            $table->string('name')->nullable(); // User-friendly name like "Production Server"
            $table->string('integration_type')->default('server_monitor');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->json('metadata')->nullable(); // Store additional config like paths
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['token', 'active']);
            $table->index(['ecosystem_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installation_tokens');
    }
};
