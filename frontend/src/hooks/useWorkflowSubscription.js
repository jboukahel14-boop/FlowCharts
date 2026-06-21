import { useEffect, useRef } from 'react';
import { getEchoInstance } from '../services/echo.js';
import { useWorkflowStore } from '../stores/useWorkflowStore.js';

export function useWorkflowSubscription(workflowId) {
  const subscribedRef = useRef(false);
  const { updateNodeStatus, loadWorkflow } = useWorkflowStore();

  useEffect(() => {
    if (!workflowId || subscribedRef.current) return;

    const echo = getEchoInstance();
    const channel = echo.private(`workflow.${workflowId}`);

    channel.listen('.workflow.updated', (event) => {
      switch (event.action) {
        case 'updated':
          if (event.user_id !== useWorkflowStore.getState().userId) {
            loadWorkflow(workflowId).catch(() => {});
          }
          break;

        case 'executed':
          for (const nodeId of Object.keys(event.node_statuses || {})) {
            updateNodeStatus(nodeId, event.node_statuses[nodeId]);
          }
          break;

        case 'deleted':
          break;
      }
    });

    channel.error((error) => {
      console.error('[WorkflowSubscription] Channel error:', error);
    });

    subscribedRef.current = true;

    return () => {
      if (echo) {
        echo.leave(`workflow.${workflowId}`);
      }
      subscribedRef.current = false;
    };
  }, [workflowId, loadWorkflow, updateNodeStatus]);
}
