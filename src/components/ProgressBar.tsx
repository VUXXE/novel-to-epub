'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { BuildProgress } from '@/types/novel';

interface ProgressBarProps {
  progress: BuildProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  if (progress.status === 'idle') return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-200">
          {progress.status !== 'done' && progress.status !== 'error' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          )}
          {progress.currentStep || 'Processing...'}
        </span>
        <span className="font-semibold text-indigo-400">{progress.percent}%</span>
      </div>

      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.message && (
        <p className="text-xs text-slate-400 truncate">{progress.message}</p>
      )}
    </div>
  );
};
