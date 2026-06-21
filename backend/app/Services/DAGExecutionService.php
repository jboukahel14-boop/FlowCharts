<?php

namespace App\Services;

use App\Models\Workflow;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class DAGExecutionService
{
    private array $nodes;
    private array $edges;
    private array $adjacencyList;
    private array $inDegree;
    private array $nodeMap;

    public function __construct(array $nodes, array $edges)
    {
        $this->nodes = $nodes;
        $this->edges = $edges;
        $this->adjacencyList = [];
        $this->inDegree = [];
        $this->nodeMap = [];
    }

    public function validateAndExecute(Workflow $workflow): array
    {
        $this->buildGraph();
        $topologicalOrder = $this->topologicalSort();
        $executionPlan = $this->buildExecutionPlan($topologicalOrder);

        $workflow->update([
            'last_validated_at' => now(),
            'validation_errors' => null,
            'execution_plan' => $executionPlan,
        ]);

        return [
            'valid' => true,
            'execution_order' => $topologicalOrder,
            'execution_plan' => $executionPlan,
        ];
    }

    public function validate(): array
    {
        $errors = [];
        $warnings = [];

        if (empty($this->nodes)) {
            return [
                'valid' => false,
                'errors' => [['type' => 'error', 'message' => 'Workflow must contain at least one node']],
                'warnings' => [],
            ];
        }

        $this->buildGraph();

        $nodeIds = array_keys($this->nodeMap);

        foreach ($this->edges as $index => $edge) {
            if (!isset($edge['source']) || !isset($edge['target'])) {
                $errors[] = ['type' => 'error', 'message' => "Edge at index {$index} is missing source or target"];
                continue;
            }
            if (!in_array($edge['source'], $nodeIds, true)) {
                $errors[] = ['type' => 'error', 'message' => "Edge references non-existent source node: {$edge['source']}"];
            }
            if (!in_array($edge['target'], $nodeIds, true)) {
                $errors[] = ['type' => 'error', 'message' => "Edge references non-existent target node: {$edge['target']}"];
            }
        }

        if (!empty($errors)) {
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        try {
            $topologicalOrder = $this->topologicalSort();
        } catch (\RuntimeException $e) {
            $errors[] = ['type' => 'error', 'message' => $e->getMessage()];
            return ['valid' => false, 'errors' => $errors, 'warnings' => $warnings];
        }

        $triggerNodes = array_filter($this->nodes, fn($n) => ($n['type'] ?? $n['data']['type'] ?? null) === 'trigger');
        if (empty($triggerNodes)) {
            $warnings[] = ['type' => 'warning', 'message' => 'No trigger node found. Workflow will not start automatically.'];
        }

        $entryPoints = array_keys(array_filter($this->inDegree, fn($d) => $d === 0));
        if (count($entryPoints) > 1) {
            $warnings[] = [
                'type' => 'warning',
                'message' => 'Multiple entry points detected (' . count($entryPoints) . '). Consider using a single trigger node.',
            ];
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'topological_order' => $topologicalOrder,
        ];
    }

    public function getExecutionPlan(Workflow $workflow): array
    {
        $this->buildGraph();
        $topologicalOrder = $this->topologicalSort();
        return $this->buildExecutionPlan($topologicalOrder);
    }

    private function buildGraph(): void
    {
        $this->adjacencyList = [];
        $this->inDegree = [];
        $this->nodeMap = [];

        foreach ($this->nodes as $node) {
            $id = $node['id'];
            $this->adjacencyList[$id] = [];
            $this->inDegree[$id] = 0;
            $this->nodeMap[$id] = $node;
        }

        foreach ($this->edges as $edge) {
            $source = $edge['source'] ?? null;
            $target = $edge['target'] ?? null;

            if ($source && $target && isset($this->adjacencyList[$source])) {
                $this->adjacencyList[$source][] = $target;
                $this->inDegree[$target] = ($this->inDegree[$target] ?? 0) + 1;
            }
        }
    }

    private function topologicalSort(): array
    {
        $inDegree = $this->inDegree;
        $queue = [];

        foreach ($inDegree as $nodeId => $degree) {
            if ($degree === 0) {
                $queue[] = $nodeId;
            }
        }

        if (empty($queue)) {
            throw new \RuntimeException(
                'Cycle detected: all nodes have incoming edges, forming a closed loop. ' .
                'Every node in the graph is part of a cycle.'
            );
        }

        $sortedOrder = [];
        $visitedCount = 0;

        while (!empty($queue)) {
            $current = array_shift($queue);
            $sortedOrder[] = $current;
            $visitedCount++;

            foreach ($this->adjacencyList[$current] as $neighbor) {
                $inDegree[$neighbor]--;
                if ($inDegree[$neighbor] === 0) {
                    $queue[] = $neighbor;
                }
            }
        }

        if ($visitedCount !== count($this->nodes)) {
            $visitedSet = array_flip($sortedOrder);
            $cycleNodes = array_values(
                array_filter($this->nodes, fn($n) => !isset($visitedSet[$n['id']]))
            );
            $cycleLabels = array_map(
                fn($n) => $n['data']['label'] ?? $n['id'],
                $cycleNodes
            );
            throw new \RuntimeException(
                'Cycle detected involving nodes: ' . implode(', ', array_slice($cycleLabels, 0, 10)) .
                (count($cycleLabels) > 10 ? ' and ' . (count($cycleLabels) - 10) . ' more' : '')
            );
        }

        return $sortedOrder;
    }

    private function buildExecutionPlan(array $topologicalOrder): array
    {
        $plan = [];

        foreach ($topologicalOrder as $orderIndex => $nodeId) {
            $node = $this->nodeMap[$nodeId] ?? null;
            if (!$node) {
                continue;
            }

            $incoming = array_values(
                array_filter(
                    $this->edges,
                    fn($e) => ($e['target'] ?? null) === $nodeId
                )
            );
            $outgoing = array_values(
                array_filter(
                    $this->edges,
                    fn($e) => ($e['source'] ?? null) === $nodeId
                )
            );

            $plan[] = [
                'node_id' => $nodeId,
                'label' => $node['data']['label'] ?? 'Unnamed',
                'type' => $node['type'] ?? $node['data']['type'] ?? 'unknown',
                'config' => $node['data']['config'] ?? [],
                'order' => $orderIndex,
                'depth' => $this->computeDepth($nodeId),
                'incoming_edges' => array_map(fn($e) => [
                    'source_id' => $e['source'],
                    'source_label' => $this->nodeMap[$e['source']]['data']['label'] ?? $e['source'],
                ], $incoming),
                'outgoing_edges' => array_map(fn($e) => [
                    'target_id' => $e['target'],
                    'target_label' => $this->nodeMap[$e['target']]['data']['label'] ?? $e['target'],
                ], $outgoing),
            ];
        }

        return $plan;
    }

    private function computeDepth(string $nodeId): int
    {
        $depth = 0;
        $current = $nodeId;
        $visited = [];

        while ($current !== null) {
            $incoming = array_values(
                array_filter(
                    $this->edges,
                    fn($e) => ($e['target'] ?? null) === $current
                )
            );
            if (empty($incoming)) {
                break;
            }
            if (in_array($current, $visited, true)) {
                break;
            }
            $visited[] = $current;
            $current = $incoming[0]['source'];
            $depth++;
        }

        return $depth;
    }

    public static function fromWorkflow(Workflow $workflow): self
    {
        $nodes = is_string($workflow->nodes) ? json_decode($workflow->nodes, true) : ($workflow->nodes ?? []);
        $edges = is_string($workflow->edges) ? json_decode($workflow->edges, true) : ($workflow->edges ?? []);

        return new self($nodes ?? [], $edges ?? []);
    }

    public static function fromPayload(array $payload): self
    {
        return new self($payload['nodes'] ?? [], $payload['edges'] ?? []);
    }
}
