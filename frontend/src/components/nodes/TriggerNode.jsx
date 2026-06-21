import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const colorMap = {
  idle: 'border-emerald-500/50 bg-emerald-500/5',
  running: 'border-emerald-400 bg-emerald-500/10 animate-pulse-glow',
  success: 'border-emerald-400 bg-emerald-500/20',
  error: 'border-red-500 bg-red-500/10',
};

const iconMap = {
  zap: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'globe': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function TriggerNode({ data, selected }) {
  const statusClass = colorMap[data.status] || colorMap.idle;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-200
        ${statusClass}
        ${selected ? 'ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20' : ''}
        bg-node-bg
      `}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
          {iconMap[data.icon] || iconMap.zap}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Trigger</div>
          <div className="text-sm font-medium text-gray-100 truncate">{data.label}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-node-bg !shadow-lg"
      />
    </div>
  );
}

export default memo(TriggerNode);
