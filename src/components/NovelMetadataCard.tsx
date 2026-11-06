'use client';

import React, { useState } from 'react';
import { BookMarked, Edit3, Image as ImageIcon } from 'lucide-react';
import { NovelMetadata } from '@/types/novel';

interface NovelMetadataCardProps {
  metadata: NovelMetadata;
  onChange: (updated: NovelMetadata) => void;
}

export const NovelMetadataCard: React.FC<NovelMetadataCardProps> = ({
  metadata,
  onChange
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <BookMarked className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-slate-100">2. Novel Details & Artwork</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
        {/* Cover Preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full h-64 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center relative shadow-inner">
            {metadata.coverUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={metadata.coverUrl}
                alt={metadata.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 text-slate-500 flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-slate-600" />
                <span className="text-xs">Canvas Fallback Cover Will Be Generated</span>
              </div>
            )}
          </div>
          <div className="w-full">
            <input
              type="text"
              value={metadata.coverUrl}
              onChange={(e) => {
                setImgError(false);
                onChange({ ...metadata, coverUrl: e.target.value });
              }}
              placeholder="Cover Image URL"
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Text Fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Book Title (English)
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => onChange({ ...metadata, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Author
              </label>
              <input
                type="text"
                value={metadata.author}
                onChange={(e) => onChange({ ...metadata, author: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Original / Chinese Title
            </label>
            <input
              type="text"
              value={metadata.originalTitle}
              onChange={(e) => onChange({ ...metadata, originalTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Synopsis & Description
            </label>
            <textarea
              rows={4}
              value={metadata.synopsis}
              onChange={(e) => onChange({ ...metadata, synopsis: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
