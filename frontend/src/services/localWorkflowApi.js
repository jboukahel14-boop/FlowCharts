import { DAGValidator } from '../utils/dagValidator.js';

const STORAGE_KEY = 'flowcharts_workflows';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage write failed:', e);
  }
}

function toResource(workflow) {
  return {
    id: workflow.id,
    uuid: workflow.uuid,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes || [],
    edges: workflow.edges || [],
    status: workflow.status || 'draft',
    execution_plan: workflow.execution_plan || null,
    last_validated_at: workflow.last_validated_at || null,
    last_executed_at: workflow.last_executed_at || null,
    execution_count: workflow.execution_count || 0,
    node_count: (workflow.nodes || []).length,
    edge_count: (workflow.edges || []).length,
    is_valid: workflow.status !== 'invalid',
    created_at: workflow.created_at,
    updated_at: workflow.updated_at,
  };
}

export const localWorkflowApi = {
  listWorkflows: async (params = {}) => {
    const all = loadAll();
    let list = Object.values(all).map(toResource);
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((w) => w.name.toLowerCase().includes(term));
    }
    list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return { data: { data: list, message: 'Workflows retrieved' } };
  },

  getWorkflow: async (id) => {
    const all = loadAll();
    const workflow = all[id];
    if (!workflow) throw new Error('Workflow not found');
    return { data: { data: toResource(workflow), message: 'Workflow retrieved' } };
  },

  createWorkflow: async (data) => {
    const all = loadAll();
    const now = new Date().toISOString();
    const id = generateId();
    const workflow = {
      id,
      uuid: crypto.randomUUID ? crypto.randomUUID() : `uuid-${id}`,
      name: data.name || 'Untitled Workflow',
      description: data.description || null,
      nodes: data.nodes || [],
      edges: data.edges || [],
      status: 'draft',
      execution_plan: null,
      last_validated_at: null,
      last_executed_at: null,
      execution_count: 0,
      created_at: now,
      updated_at: now,
    };
    all[id] = workflow;
    saveAll(all);
    return { data: { data: toResource(workflow), message: 'Workflow created' } };
  },

  updateWorkflow: async (id, data) => {
    const all = loadAll();
    const workflow = all[id];
    if (!workflow) throw new Error('Workflow not found');
    const result = DAGValidator.validate(data.nodes || [], data.edges || []);
    const updated = {
      ...workflow,
      name: data.name ?? workflow.name,
      description: data.description ?? workflow.description,
      nodes: data.nodes ?? workflow.nodes,
      edges: data.edges ?? workflow.edges,
      status: result.valid ? 'draft' : 'invalid',
      validation_errors: result.valid ? null : result.errors,
      last_validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    all[id] = updated;
    saveAll(all);
    return { data: { data: toResource(updated), message: 'Workflow updated' } };
  },

  deleteWorkflow: async (id) => {
    const all = loadAll();
    delete all[id];
    saveAll(all);
    return { data: { message: 'Workflow deleted' } };
  },

  executeWorkflow: async (id) => {
    const all = loadAll();
    const workflow = all[id];
    if (!workflow) throw new Error('Workflow not found');
    const result = DAGValidator.validate(workflow.nodes || [], workflow.edges || []);
    if (!result.valid) throw new Error('Cannot execute invalid workflow');
    const plan = DAGValidator.getExecutionPlan(workflow.nodes || [], workflow.edges || []);
    workflow.execution_plan = plan;
    workflow.execution_count = (workflow.execution_count || 0) + 1;
    workflow.last_executed_at = new Date().toISOString();
    workflow.updated_at = new Date().toISOString();
    all[id] = workflow;
    saveAll(all);
    return { data: { data: { execution_plan: plan, execution_count: workflow.execution_count }, message: 'Workflow execution started' } };
  },

  validateWorkflow: async (id) => {
    const all = loadAll();
    const workflow = all[id];
    if (!workflow) throw new Error('Workflow not found');
    const result = DAGValidator.validate(workflow.nodes || [], workflow.edges || []);
    workflow.last_validated_at = new Date().toISOString();
    workflow.validation_errors = result.valid ? null : result.errors;
    workflow.status = result.valid ? 'draft' : 'invalid';
    all[id] = workflow;
    saveAll(all);
    return { data: { data: result, message: result.valid ? 'Workflow validation passed' : 'Workflow validation failed' } };
  },
};
