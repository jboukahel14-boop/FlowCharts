import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const colorMap = {
  idle: 'border-blue-500/50 bg-blue-500/5',
  running: 'border-blue-400 bg-blue-500/10 animate-pulse-glow',
  success: 'border-blue-400 bg-blue-500/20',
  error: 'border-red-500 bg-red-500/10',
};

const iconMap = {
  play: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  filter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
};

function ActionNode({ data, selected }) {
  const statusClass = colorMap[data.status] || colorMap.idle;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-200
        ${statusClass}
        ${selected ? 'ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/20' : ''}
        bg-node-bg
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-node-bg !shadow-lg"
      />
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
          {iconMap[data.icon] || iconMap.play}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Action</div>
          <div className="text-sm font-medium text-gray-100 truncate">{data.label}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-node-bg !shadow-lg"
      />
    </div>
  );
}

export default memo(ActionNode);
