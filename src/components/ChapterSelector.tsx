'use client';

import React, { useMemo, useState } from 'react';
import { CheckSquare, ListOrdered, Search, Square } from 'lucide-react';
import { Chapter } from '@/types/novel';

interface ChapterSelectorProps {
  chapters: Chapter[];
  onToggle: (index: number) => void;
  onToggleAll: (selected: boolean) => void;
}

export const ChapterSelector: React.FC<ChapterSelectorProps> = ({
  chapters,
  onToggle,
  onToggleAll
}) => {
  const [filter, setFilter] = useState('');

  const selectedCount = useMemo(
    () => chapters.filter((c) => c.selected).length,
    [chapters]
  );

  const filteredChapters = useMemo(() => {
    const q = filter.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (c) => c.title.toLowerCase().includes(q) || `#${c.num}`.includes(q)
    );
  }, [chapters, filter]);

  const allSelected = selectedCount === chapters.length && chapters.length > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-100">
            3. Select Chapters ({selectedCount}/{chapters.length})
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onToggleAll(!allSelected)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            {allSelected ? (
              <>
                <Square className="w-3.5 h-3.5 text-slate-400" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select All</span>
              </>
            )}
          </button>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search chapters..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto border border-slate-800/80 rounded-lg bg-slate-950 divide-y divide-slate-800/50">
        {filteredChapters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No chapters match your search query.
          </div>
        ) : (
          filteredChapters.map((ch, idx) => (
            <div
              key={ch.id}
              onClick={() => onToggle(idx)}
              className="flex items-center gap-3 px-3.5 py-2 hover:bg-slate-900/60 transition-colors cursor-pointer text-xs"
            >
              <input
                type="checkbox"
                checked={ch.selected}
                onChange={() => {}} // Controlled by container onClick
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <span className="font-semibold text-indigo-400 min-w-8">
                #{ch.num}
              </span>
              <span className="text-slate-200 truncate flex-1" title={ch.title}>
                {ch.title}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
