import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import { workflowApi } from '../services/workflowApi.js';

const initialNodeTypes = {
  trigger: { label: 'Trigger', color: 'emerald', icon: 'zap', category: 'Triggers' },
  action: { label: 'Action', color: 'blue', icon: 'play', category: 'Actions' },
  condition: { label: 'Condition', color: 'amber', icon: 'git-branch', category: 'Conditions' },
};

const generateId = () => `node_${crypto.randomUUID().slice(0, 8)}`;

const findCycle = (nodes, edges) => {
  const adjacency = new Map();
  const inDegree = new Map();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const list = adjacency.get(edge.source);
    if (list) {
      list.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  const queue = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift();
    visited++;
    for (const neighbor of (adjacency.get(current) || [])) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return visited !== nodes.length;
};

export const useWorkflowStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowId: null,
  workflowName: 'Untitled Workflow',
  isLoading: false,
  isSaving: false,
  error: null,
  isDirty: false,
  viewport: { x: 0, y: 0, zoom: 1 },
  sidebarOpen: true,
  configPanelOpen: false,
  collaboratorCursors: {},

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      isDirty: true,
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      isDirty: true,
    }));
  },

  onConnect: (connection) => {
    set((state) => {
      const newEdge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      };
      const updatedEdges = addEdge(newEdge, state.edges);

      if (findCycle(state.nodes, updatedEdges)) {
        return state;
      }

      return { edges: updatedEdges, isDirty: true };
    });
  },

  addNode: (type, position) => {
    const nodeConfig = initialNodeTypes[type];
    if (!nodeConfig) return;

    const newNode = {
      id: generateId(),
      type,
      position: position || { x: 250, y: 250 },
      data: {
        label: `${nodeConfig.label} ${Date.now() % 1000}`,
        config: {},
        status: 'idle',
        color: nodeConfig.color,
        icon: nodeConfig.icon,
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      isDirty: true,
    }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, position } : n,
      ),
      isDirty: true,
    }));
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n,
      ),
      isDirty: true,
    }));
  },

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n,
      ),
    }));
  },

  setSelectedNode: (nodeId) => {
    set({ selectedNode: nodeId, configPanelOpen: !!nodeId });
  },

  setViewport: (viewport) => {
    set({ viewport });
  },

  setCollaboratorCursor: (userId, data) => {
    set((state) => ({
      collaboratorCursors: {
        ...state.collaboratorCursors,
        [userId]: { ...data, lastSeen: Date.now() },
      },
    }));
  },

  removeCollaboratorCursor: (userId) => {
    set((state) => {
      const { [userId]: _, ...rest } = state.collaboratorCursors;
      return { collaboratorCursors: rest };
    });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleConfigPanel: () =>
    set((state) => ({ configPanelOpen: !state.configPanelOpen })),

  loadWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await workflowApi.getWorkflow(workflowId);
      const workflow = response.data.data;
      set({
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
        workflowId: workflow.id,
        workflowName: workflow.name,
        isLoading: false,
        isDirty: false,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load workflow';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  saveWorkflow: async () => {
    const { nodes, edges, workflowId, workflowName } = get();
    set({ isSaving: true, error: null });
    try {
      const payload = {
        name: workflowName,
        nodes,
        edges,
      };
      const response = workflowId
        ? await workflowApi.updateWorkflow(workflowId, payload)
        : await workflowApi.createWorkflow(payload);

      const saved = response.data.data;
      set({
        workflowId: saved.id,
        workflowName: saved.name,
        isSaving: false,
        isDirty: false,
      });
      return saved;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save workflow';
      set({ isSaving: false, error: message });
      throw new Error(message);
    }
  },

  reset: () => {
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      workflowId: null,
      workflowName: 'Untitled Workflow',
      isLoading: false,
      isSaving: false,
      error: null,
      isDirty: false,
      configPanelOpen: false,
    });
  },
}));
