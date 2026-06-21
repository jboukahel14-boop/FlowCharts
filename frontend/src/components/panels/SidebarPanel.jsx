import { useCallback } from 'react';
import { useWorkflowStore } from '../../stores/useWorkflowStore.js';

const nodeDefinitions = [
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Starts the workflow (webhook, schedule, etc.)',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: 'action',
    label: 'Action',
    description: 'Performs an operation (API call, transform, etc.)',
    color: 'blue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'condition',
    label: 'Condition',
    description: 'Branches logic based on true/false evaluation',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l-5 5m0 0l5 5m-5-5h18V7l-5-5m-5 5l5-5m-5 5v12" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="19" cy="19" r="2" />
      </svg>
    ),
  },
];

const colorMap = {
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-500/10',
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-500/10',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/10',
};

const accentMap = {
  emerald: 'text-emerald-400 bg-emerald-500/15',
  blue: 'text-blue-400 bg-blue-500/15',
  amber: 'text-amber-400 bg-amber-500/15',
};

export default function SidebarPanel() {
  const { sidebarOpen } = useWorkflowStore();

  const onDragStart = useCallback((event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  if (!sidebarOpen) return null;

  return (
    <div className="w-72 flex-shrink-0 h-full overflow-y-auto border-r border-glass-border">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Node Palette</h2>
        </div>

        <div className="space-y-3">
          {nodeDefinitions.map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={`
                group relative p-3.5 rounded-xl border bg-gradient-to-b cursor-grab
                active:cursor-grabbing transition-all duration-200
                ${colorMap[node.color]}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${accentMap[node.color]}`}>
                  {node.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-bold text-${node.color}-400`}>
                    {node.label}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                    {node.description}
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
