<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Services\DAGExecutionService;

class WorkflowResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'nodes' => $this->nodes,
            'edges' => $this->edges,
            'execution_plan' => $this->when(
                $request->routeIs('*.show') || $request->has('include_plan'),
                $this->execution_plan
            ),
            'status' => $this->status,
            'last_validated_at' => $this->last_validated_at?->toISOString(),
            'last_executed_at' => $this->last_executed_at?->toISOString(),
            'execution_count' => $this->execution_count,
            'node_count' => $this->node_count,
            'edge_count' => $this->edge_count,
            'is_valid' => $this->isValid(),
            'validation_errors' => $this->when(
                $request->user()?->can('viewValidationErrors', $this->resource),
                $this->validation_errors
            ),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
