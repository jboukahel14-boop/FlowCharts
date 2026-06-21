<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workflow;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class WorkflowPolicy
{
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Workflow $workflow): bool
    {
        return $user->id === $workflow->user_id || $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->canManageWorkflows();
    }

    public function update(User $user, Workflow $workflow): bool
    {
        if ($user->isViewer()) {
            return false;
        }

        return $user->id === $workflow->user_id || $user->isAdmin();
    }

    public function delete(User $user, Workflow $workflow): bool
    {
        if (!$user->canDeleteWorkflows()) {
            return false;
        }

        return $user->id === $workflow->user_id || $user->isAdmin();
    }

    public function execute(User $user, Workflow $workflow): bool
    {
        if ($user->isViewer()) {
            return false;
        }

        return $user->id === $workflow->user_id || $user->isAdmin();
    }

    public function validate(User $user, Workflow $workflow): bool
    {
        return $user->canManageWorkflows() && ($user->id === $workflow->user_id || $user->isAdmin());
    }

    public function viewValidationErrors(User $user, Workflow $workflow): bool
    {
        return $user->id === $workflow->user_id || $user->isAdmin();
    }

    public function share(User $user, Workflow $workflow): bool
    {
        return $user->canManageWorkflows() && ($user->id === $workflow->user_id || $user->isAdmin());
    }
}
