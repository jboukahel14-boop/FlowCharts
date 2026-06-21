import { useEffect, useRef, useCallback } from 'react';
import { useWorkflowStore } from '../stores/useWorkflowStore.js';

export function useCanvasPresence({ workflowId, echo, userId, userName }) {
  const throttleRef = useRef(0);
  const { setCollaboratorCursor, removeCollaboratorCursor, setViewport } = useWorkflowStore();

  const broadcastCursor = useCallback(
    (position) => {
      const now = Date.now();
      if (now - throttleRef.current < 50) return;
      throttleRef.current = now;

      if (echo && workflowId) {
        echo
          .channel(`workflow.${workflowId}`)
          .whisper('cursor-moved', {
            userId,
            userName,
            x: position.x,
            y: position.y,
            timestamp: now,
          });
      }
    },
    [echo, workflowId, userId, userName],
  );

  const broadcastViewport = useCallback(
    (viewport) => {
      if (echo && workflowId) {
        echo
          .channel(`workflow.${workflowId}`)
          .whisper('viewport-changed', {
            userId,
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom,
          });
      }
    },
    [echo, workflowId, userId],
  );

  const broadcastNodeDrag = useCallback(
    (nodeId, position) => {
      if (echo && workflowId) {
        echo
          .channel(`workflow.${workflowId}`)
          .whisper('node-dragged', {
            userId,
            nodeId,
            x: position.x,
            y: position.y,
          });
      }
    },
    [echo, workflowId, userId],
  );

  useEffect(() => {
    if (!echo || !workflowId) return;

    const channel = echo.join(`workflow.${workflowId}`);

    channel
      .here((users) => {
        console.log(`Presence channel joined. ${users.length} user(s) online.`);
      })
      .joining((user) => {
        console.log(`${user.name} joined the workflow`);
      })
      .leaving((user) => {
        removeCollaboratorCursor(user.id);
        console.log(`${user.name} left the workflow`);
      })
      .listenForWhisper('cursor-moved', (e) => {
        setCollaboratorCursor(e.userId, {
          userName: e.userName,
          x: e.x,
          y: e.y,
          timestamp: e.timestamp,
        });
      })
      .listenForWhisper('viewport-changed', (e) => {
        setViewport({ x: e.x, y: e.y, zoom: e.zoom });
      })
      .listenForWhisper('node-dragged', (e) => {
        useWorkflowStore
          .getState()
          .updateNodePosition(e.nodeId, { x: e.x, y: e.y });
      })
      .error((error) => {
        console.error('Presence channel error:', error);
      });

    return () => {
      echo.leave(`workflow.${workflowId}`);
    };
  }, [echo, workflowId, removeCollaboratorCursor, setCollaboratorCursor, setViewport]);

  return { broadcastCursor, broadcastViewport, broadcastNodeDrag };
}
