import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  useNodesInitialized,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../stores/useWorkflowStore.js';
import TriggerNode from './nodes/TriggerNode.jsx';
import ActionNode from './nodes/ActionNode.jsx';
import ConditionNode from './nodes/ConditionNode.jsx';
import SidebarPanel from './panels/SidebarPanel.jsx';
import ConfigPanel from './panels/ConfigPanel.jsx';
import ToolbarPanel from './panels/ToolbarPanel.jsx';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#6366f1', strokeWidth: 2 },
};

const proOptions = { hideAttribution: true };

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    setViewport,
  } = useWorkflowStore();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !['trigger', 'action', 'condition'].includes(type)) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode],
  );

  const onNodeClick = useCallback(
    (_event, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onMoveEnd = useCallback(
    (_event, viewport) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  return (
    <div className="h-full flex flex-col">
      <ToolbarPanel />
      <div className="flex-1 flex overflow-hidden">
        <SidebarPanel />
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onMoveEnd={onMoveEnd}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            proOptions={proOptions}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode="Shift"
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#2a2a3e"
            />
            <Controls
              showInteractive={false}
              className="!bottom-4 !left-4 !shadow-lg !rounded-xl !overflow-hidden"
            />
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                const colors = { trigger: '#10b981', action: '#3b82f6', condition: '#f59e0b' };
                return colors[node.type] || '#6366f1';
              }}
              maskColor="rgba(15, 15, 19, 0.8)"
              className="!bottom-4 !right-4 !shadow-lg !rounded-xl !overflow-hidden !border !border-glass-border"
              style={{ background: '#16161f' }}
            />
          </ReactFlow>
        </div>
        <ConfigPanel />
      </div>
    </div>
  );
}
