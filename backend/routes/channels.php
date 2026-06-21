<?php

use App\Broadcasting\WorkflowChannel;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('workflow.{workflowId}', WorkflowChannel::class);
