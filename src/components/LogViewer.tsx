'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { LogMessage } from '@/types/novel';

interface LogViewerProps {
  logs: LogMessage[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Execution Log Console</span>
        </div>
        <span className="text-[10px] text-slate-500">{logs.length} entries</span>
      </div>

      <div
        ref={containerRef}
        className="p-3.5 max-h-44 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text"
      >
        {logs.map((log) => {
          let color = 'text-slate-400';
          if (log.type === 'success') color = 'text-emerald-400';
          if (log.type === 'warn') color = 'text-amber-400';
          if (log.type === 'error') color = 'text-rose-400';
          if (log.type === 'info') color = 'text-cyan-400';

          return (
            <div key={log.id} className="flex gap-2">
              <span className="text-slate-600 select-none">[{log.timestamp}]</span>
              <span className={color}>{log.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
