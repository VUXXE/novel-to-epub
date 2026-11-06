'use client';

import React from 'react';
import { ArrowRight, Globe, Loader2, Sparkles } from 'lucide-react';

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  onFetch: () => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  url,
  setUrl,
  isLoading,
  onFetch
}) => {
  const presets = [
    {
      title: 'On My Way (72 Ch.)',
      url: 'https://mydramanovel.com/zhi-wo-na-cai-shi-chang-de-bai-yue-guang/'
    },
    {
      title: 'Back to Life (52 Ch.)',
      url: 'https://mydramanovel.com/dong-feng-chui-you-sheng/'
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && url.trim()) {
      onFetch();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-slate-100">1. Enter Web Novel Series URL</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="https://mydramanovel.com/novel-series-slug/"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          onClick={onFetch}
          disabled={isLoading || !url.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-indigo-600/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <span>Fetch Novel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-medium text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Quick Samples:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.url}
            type="button"
            onClick={() => {
              setUrl(preset.url);
            }}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-300 border border-slate-700/60 transition-colors text-slate-300"
          >
            {preset.title}
          </button>
        ))}
      </div>
    </div>
  );
};
