import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import WorkflowCanvas from '../components/WorkflowCanvas.jsx';
import { useWorkflowStore } from '../stores/useWorkflowStore.js';

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadWorkflow, isLoading, error, reset, workflowId } = useWorkflowStore();

  useEffect(() => {
    if (id && id !== 'new') {
      loadWorkflow(id).catch((err) => {
        toast.error(`Failed to load workflow: ${err.message}`);
        navigate('/', { replace: true });
      });
    } else {
      reset();
    }

    return () => {
      if (!workflowId) reset();
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span className="text-sm text-gray-400">Loading workflow...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="glass-panel p-8 max-w-md text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Failed to Load</h2>
          <p className="text-sm text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
          >
            Back to Workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-canvas-bg">
      <WorkflowCanvas />
    </div>
  );
}
