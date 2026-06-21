import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useWorkflowStore } from '../../stores/useWorkflowStore.js';
import { DAGValidator } from '../../utils/dagValidator.js';

export default function ToolbarPanel() {
  const {
    workflowName,
    isSaving,
    isDirty,
    saveWorkflow,
    toggleSidebar,
    sidebarOpen,
    nodes,
    edges,
    removeNode,
    selectedNode,
    setSelectedNode,
  } = useWorkflowStore();

  const [validating, setValidating] = useState(false);

  const handleSave = useCallback(async () => {
    try {
      const saved = await saveWorkflow();
      toast.success(`Workflow "${saved.name}" saved successfully`);
    } catch (err) {
      toast.error(err.message);
    }
  }, [saveWorkflow]);

  const handleValidate = useCallback(() => {
    setValidating(true);
    try {
      const result = DAGValidator.validate(nodes, edges);
      if (result.valid) {
        toast.success('Workflow is valid — no cycles detected');
      }
      for (const error of result.errors) {
        toast.error(error.message, { duration: 5000 });
      }
      for (const warning of result.warnings) {
        toast(warning.message, {
          icon: '⚠️',
          duration: 4000,
          style: { border: '1px solid #f59e0b50' },
        });
      }
    } catch (err) {
      toast.error(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  }, [nodes, edges]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      removeNode(selectedNode);
      setSelectedNode(null);
      toast.success('Node deleted');
    }
  }, [selectedNode, removeNode, setSelectedNode]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDelete();
    }
  }, [handleDelete]);

  return (
    <div className="h-14 border-b border-glass-border flex items-center justify-between px-4 bg-glass-bg backdrop-blur-glass">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="h-5 w-px bg-glass-border" />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-sm font-semibold text-gray-200">{workflowName}</span>
          {isDirty && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Unsaved</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleValidate}
          disabled={validating || nodes.length === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-glass-border hover:bg-gray-800 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {validating ? 'Validating...' : 'Validate'}
        </button>

        <button
          onClick={handleDelete}
          disabled={!selectedNode}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Delete
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
