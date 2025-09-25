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
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ecosystem_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type'); // gitlab, github, sentry, terraform, nginx, webhook, etc.
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('category'); // Version Control, Monitoring, Infrastructure, Custom
            $table->boolean('connected')->default(false);
            $table->json('config')->nullable(); // Store connection settings, tokens, etc.
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
