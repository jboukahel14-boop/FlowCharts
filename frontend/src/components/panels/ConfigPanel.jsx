import { useCallback } from 'react';
import { useWorkflowStore } from '../../stores/useWorkflowStore.js';

const configFields = {
  trigger: [
    { key: 'event', label: 'Event Type', type: 'select', options: ['webhook', 'schedule', 'form_submission', 'email_received'] },
    { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.example.com/trigger' },
  ],
  action: [
    { key: 'endpoint', label: 'API Endpoint', type: 'text', placeholder: 'https://api.example.com/action' },
    { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    { key: 'payload', label: 'Payload Template', type: 'textarea', placeholder: '{ "data": {{input}} }' },
    { key: 'retries', label: 'Max Retries', type: 'number', placeholder: '3' },
  ],
  condition: [
    { key: 'field', label: 'Field to Evaluate', type: 'text', placeholder: 'data.status' },
    { key: 'operator', label: 'Operator', type: 'select', options: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty'] },
    { key: 'value', label: 'Compare Value', type: 'text', placeholder: 'active' },
  ],
};

export default function ConfigPanel() {
  const { selectedNode, nodes, configPanelOpen, updateNodeConfig, toggleConfigPanel } = useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedNode);

  const handleConfigChange = useCallback((key, value) => {
    if (selectedNode) {
      updateNodeConfig(selectedNode, { [key]: value });
    }
  }, [selectedNode, updateNodeConfig]);

  if (!configPanelOpen || !node) return null;

  const fields = configFields[node.type] || [];
  const config = node.data.config || {};

  return (
    <div className="w-80 flex-shrink-0 h-full overflow-y-auto border-l border-glass-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Configuration</h2>
          <button
            onClick={toggleConfigPanel}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 pb-4 border-b border-glass-border">
          <div className="text-sm font-medium text-gray-200">{node.data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{node.type} node</div>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  className="w-full bg-gray-800/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full bg-gray-800/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-gray-800/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
