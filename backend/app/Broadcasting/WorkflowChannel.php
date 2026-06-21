<?php

namespace App\Broadcasting;

use App\Models\User;
use App\Models\Workflow;

class WorkflowChannel
{
    public function join(User $user, string $workflowId): ?array
    {
        $workflow = Workflow::find($workflowId);

        if (!$workflow) {
            return null;
        }

        if ($user->id !== $workflow->user_id && !$user->isAdmin()) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }
}
