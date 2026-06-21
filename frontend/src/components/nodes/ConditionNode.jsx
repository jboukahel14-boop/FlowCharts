import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const colorMap = {
  idle: 'border-amber-500/50 bg-amber-500/5',
  running: 'border-amber-400 bg-amber-500/10 animate-pulse-glow',
  success: 'border-amber-400 bg-amber-500/20',
  error: 'border-red-500 bg-red-500/10',
};

const iconMap = {
  'git-branch': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l-5 5m0 0l5 5m-5-5h18V7l-5-5m-5 5l5-5m-5 5v12" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  ),
  'split': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M3 10v11m18-11v11" />
    </svg>
  ),
};

function ConditionNode({ data, selected }) {
  const statusClass = colorMap[data.status] || colorMap.idle;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-200
        ${statusClass}
        ${selected ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20' : ''}
        bg-node-bg
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-node-bg !shadow-lg"
      />
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
          {iconMap[data.icon] || iconMap['git-branch']}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Condition</div>
          <div className="text-sm font-medium text-gray-100 truncate">{data.label}</div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-500">
        <span className="text-emerald-400/70 font-medium">✓ True</span>
        <span className="text-red-400/70 font-medium">✗ False</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!w-3 !h-3 !left-[25%] !bg-emerald-500 !border-2 !border-node-bg !shadow-lg"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-3 !h-3 !left-[75%] !bg-red-500 !border-2 !border-node-bg !shadow-lg"
      />
    </div>
  );
}

export default memo(ConditionNode);
