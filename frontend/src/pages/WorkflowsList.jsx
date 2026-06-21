import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { workflowApi } from '../services/workflowApi.js';
import { DAGValidator } from '../utils/dagValidator.js';

export default function WorkflowsList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await workflowApi.listWorkflows({ search });
      setWorkflows(response.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = useCallback(async () => {
    try {
      const response = await workflowApi.createWorkflow({
        name: 'Untitled Workflow',
        nodes: [],
        edges: [],
      });
      navigate(`/workflows/${response.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workflow');
    }
  }, [navigate]);

  const handleDelete = useCallback(async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await workflowApi.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete workflow');
    }
  }, []);

  const statusBadge = (workflow) => {
    if (!workflow.nodes?.length) return { label: 'Empty', class: 'bg-gray-800 text-gray-400' };

    let hasTrigger = false;
    for (const node of workflow.nodes) {
      if ((node.type || node.data?.type) === 'trigger') {
        hasTrigger = true;
        break;
      }
    }

    const result = DAGValidator.validate(workflow.nodes || [], workflow.edges || []);
    if (result.valid && hasTrigger) {
      return { label: 'Active', class: 'bg-emerald-500/15 text-emerald-400' };
    }
    return { label: 'Invalid', class: 'bg-red-500/15 text-red-400' };
  };

  return (
    <div className="min-h-screen bg-canvas-bg">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Workflows</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your automation pipelines</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/25"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Workflow
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows..."
            className="w-full max-w-md bg-gray-800/50 border border-glass-border rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No workflows yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create your first automation workflow to get started.</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {workflows.map((workflow) => {
              const badge = statusBadge(workflow);
              return (
                <div
                  key={workflow.id}
                  className="glass-panel p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-200 truncate">{workflow.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {workflow.nodes?.length || 0} nodes · {workflow.edges?.length || 0} connections
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.class}`}>
                      {badge.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workflow.id, workflow.name);
                      }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
