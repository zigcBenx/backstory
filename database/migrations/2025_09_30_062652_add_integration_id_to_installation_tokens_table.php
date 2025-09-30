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
        Schema::table('installation_tokens', function (Blueprint $table) {
            $table->foreignId('integration_id')->nullable()->constrained()->onDelete('cascade');
            $table->index(['integration_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installation_tokens', function (Blueprint $table) {
            $table->dropForeign(['integration_id']);
            $table->dropIndex(['integration_id', 'active']);
            $table->dropColumn('integration_id');
        });
    }
};
