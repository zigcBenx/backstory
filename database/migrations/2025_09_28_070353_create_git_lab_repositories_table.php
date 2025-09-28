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
        Schema::create('git_lab_repositories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->onDelete('cascade');
            $table->string('project_id'); // GitLab project ID
            $table->string('name'); // Repository name
            $table->string('full_name'); // Full name with namespace (group/project)
            $table->string('url'); // Repository URL
            $table->string('default_branch')->default('main');
            $table->json('production_branches')->nullable(); // ['main', 'master', 'production']
            $table->json('staging_keywords')->nullable(); // ['beta', 'rc', 'staging']
            $table->string('last_release_tag')->nullable();
            $table->timestamp('last_release_at')->nullable();
            $table->boolean('track_deployments_only')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['integration_id', 'project_id']);
            $table->index(['integration_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('git_lab_repositories');
    }
};
