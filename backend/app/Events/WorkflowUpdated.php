<?php

namespace App\Events;

use App\Models\Workflow;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkflowUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Workflow $workflow;
    public string $action;
    public int $userId;

    public function __construct(Workflow $workflow, string $action, int $userId)
    {
        $this->workflow = $workflow;
        $this->action = $action;
        $this->userId = $userId;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("workflow.{$this->workflow->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'workflow.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'action' => $this->action,
            'user_id' => $this->userId,
            'timestamp' => now()->toISOString(),
            'workflow' => [
                'id' => $this->workflow->id,
                'uuid' => $this->workflow->uuid,
                'name' => $this->workflow->name,
                'status' => $this->workflow->status,
                'node_count' => count($this->workflow->nodes ?? []),
                'edge_count' => count($this->workflow->edges ?? []),
            ],
        ];
    }
}
