<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->index();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('description', 1000)->nullable();

            $table->json('nodes');
            $table->json('edges');
            $table->json('execution_plan')->nullable();

            $table->string('status', 20)->default('draft')->index();
            $table->timestamp('last_validated_at')->nullable();
            $table->json('validation_errors')->nullable();
            $table->timestamp('last_executed_at')->nullable();
            $table->unsignedInteger('execution_count')->default(0);

            $table->timestamps();

            $table->index('created_at');
            $table->index('updated_at');

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'updated_at']);
        });

        DB::statement('ALTER TABLE workflows ADD INDEX workflows_nodes_index ((CAST(JSON_UNQUOTE(nodes) AS CHAR(255))))');
        DB::statement('ALTER TABLE workflows ADD INDEX workflows_status_index ((CAST(JSON_UNQUOTE(JSON_EXTRACT(nodes, \'$[*].type\')) AS CHAR(64))))');
    }

    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
