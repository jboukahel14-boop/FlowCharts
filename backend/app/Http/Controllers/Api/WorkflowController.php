<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkflowRequest;
use App\Http\Resources\WorkflowResource;
use App\Models\Workflow;
use App\Services\DAGExecutionService;
use App\Events\WorkflowUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class WorkflowController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Workflow::class, 'workflow');
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:draft,active,archived,invalid'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $workflows = Workflow::query()
            ->ownedBy($request->user()->id)
            ->when($request->search, fn($q, $search) => $q->search($search))
            ->when($request->status, fn($q, $status) => $q->where('status', $status))
            ->orderBy('updated_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'message' => 'Workflows retrieved successfully',
            'data' => WorkflowResource::collection($workflows),
            'meta' => [
                'current_page' => $workflows->currentPage(),
                'last_page' => $workflows->lastPage(),
                'per_page' => $workflows->perPage(),
                'total' => $workflows->total(),
            ],
        ]);
    }

    public function show(Workflow $workflow): JsonResponse
    {
        return response()->json([
            'message' => 'Workflow retrieved successfully',
            'data' => new WorkflowResource($workflow),
        ]);
    }

    public function store(StoreWorkflowRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $workflow = DB::transaction(function () use ($request, $validated) {
                $service = DAGExecutionService::fromPayload($validated);
                $validationResult = $service->validate();

                $workflow = Workflow::create([
                    'user_id' => $request->user()->id,
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'nodes' => $validated['nodes'],
                    'edges' => $validated['edges'],
                    'status' => $validationResult['valid'] ? ($validated['status'] ?? 'draft') : 'invalid',
                    'validation_errors' => $validationResult['valid'] ? null : $validationResult['errors'],
                    'last_validated_at' => now(),
                ]);

                if ($validationResult['valid']) {
                    $service->validateAndExecute($workflow);
                }

                return $workflow;
            });

            broadcast(new WorkflowUpdated($workflow, 'created', $request->user()->id))->toOthers();

            return response()->json([
                'message' => 'Workflow created successfully',
                'data' => new WorkflowResource($workflow),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create workflow',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function update(StoreWorkflowRequest $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validated();

        try {
            $updatedWorkflow = DB::transaction(function () use ($request, $workflow, $validated) {
                $service = DAGExecutionService::fromPayload($validated);
                $validationResult = $service->validate();

                $workflow->update([
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? $workflow->description,
                    'nodes' => $validated['nodes'],
                    'edges' => $validated['edges'],
                    'status' => $validationResult['valid'] ? 'draft' : 'invalid',
                    'validation_errors' => $validationResult['valid'] ? null : $validationResult['errors'],
                    'last_validated_at' => now(),
                ]);

                if ($validationResult['valid']) {
                    $service->validateAndExecute($workflow);
                }

                broadcast(new WorkflowUpdated($workflow, 'updated', $request->user()->id))->toOthers();

                return $workflow->fresh();
            });

            return response()->json([
                'message' => 'Workflow updated successfully',
                'data' => new WorkflowResource($updatedWorkflow),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update workflow',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function destroy(Workflow $workflow): JsonResponse
    {
        try {
            $workflow->delete();

            broadcast(new WorkflowUpdated($workflow, 'deleted', request()->user()->id))->toOthers();

            return response()->json([
                'message' => 'Workflow deleted successfully',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete workflow',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function validate(Workflow $workflow): JsonResponse
    {
        Gate::authorize('validate', $workflow);

        try {
            $service = DAGExecutionService::fromWorkflow($workflow);
            $result = $service->validate();

            $workflow->setValidationResult($result);

            if ($result['valid']) {
                $service->validateAndExecute($workflow);
            }

            return response()->json([
                'message' => $result['valid'] ? 'Workflow validation passed' : 'Workflow validation failed',
                'data' => [
                    'valid' => $result['valid'],
                    'errors' => $result['errors'],
                    'warnings' => $result['warnings'],
                    'topological_order' => $result['topological_order'] ?? null,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Validation error',
                'data' => [
                    'valid' => false,
                    'errors' => [['type' => 'error', 'message' => $e->getMessage()]],
                    'warnings' => [],
                ],
            ], 422);
        }
    }

    public function execute(Workflow $workflow): JsonResponse
    {
        Gate::authorize('execute', $workflow);

        if (!$workflow->isValid()) {
            return response()->json([
                'message' => 'Cannot execute invalid workflow. Please validate first.',
                'data' => null,
            ], 422);
        }

        try {
            $service = DAGExecutionService::fromWorkflow($workflow);
            $executionPlan = $service->getExecutionPlan($workflow);

            $workflow->markAsExecuted();

            broadcast(new WorkflowUpdated($workflow->fresh(), 'executed', request()->user()->id))->toOthers();

            return response()->json([
                'message' => 'Workflow execution started',
                'data' => [
                    'execution_plan' => $executionPlan,
                    'execution_count' => $workflow->execution_count,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Execution failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error during execution',
            ], 500);
        }
    }
}
