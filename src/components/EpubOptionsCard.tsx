'use client';

import React from 'react';
import { Download, Sliders, Type } from 'lucide-react';
import { EpubOptions, FontOption, IndentOption } from '@/types/novel';

interface EpubOptionsCardProps {
  options: EpubOptions;
  setOptions: (options: EpubOptions) => void;
  onGenerate: () => void;
  isBuilding: boolean;
  selectedCount: number;
}

export const EpubOptionsCard: React.FC<EpubOptionsCardProps> = ({
  options,
  setOptions,
  onGenerate,
  isBuilding,
  selectedCount
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-slate-100">4. EPUB Format Settings</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            Reading Typography Font
          </label>
          <select
            value={options.fontFamily}
            onChange={(e) => setOptions({ ...options, fontFamily: e.target.value as FontOption })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="serif">Classic Serif (Georgia, Songti, Times)</option>
            <option value="sans-serif">Clean Sans-Serif (System, Inter, PingFang)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Paragraph Spacing & Indentation
          </label>
          <select
            value={options.indentStyle}
            onChange={(e) => setOptions({ ...options, indentStyle: e.target.value as IndentOption })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="indent">First-line Indented (1.5em)</option>
            <option value="spaced">Modern Block Spacing (No Indent)</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        disabled={isBuilding || selectedCount === 0}
        onClick={onGenerate}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>
          {isBuilding
            ? 'Compiling EPUB on Device...'
            : `Build & Download EPUB (${selectedCount} Chapters)`}
        </span>
      </button>
    </div>
  );
};
