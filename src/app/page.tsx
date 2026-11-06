'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlInput } from '@/components/UrlInput';
import { NovelMetadataCard } from '@/components/NovelMetadataCard';
import { ChapterSelector } from '@/components/ChapterSelector';
import { EpubOptionsCard } from '@/components/EpubOptionsCard';
import { ProgressBar } from '@/components/ProgressBar';
import { LogViewer } from '@/components/LogViewer';
import {
  BuildProgress,
  Chapter,
  EpubOptions,
  LogMessage,
  NovelMetadata
} from '@/types/novel';
import { fetchAllChapters, fetchNovelMetadata } from '@/lib/extractor';
import { buildEpubBlob } from '@/lib/epubBuilder';

export default function Home() {
  const [url, setUrl] = useState(
    'https://mydramanovel.com/zhi-wo-na-cai-shi-chang-de-bai-yue-guang/'
  );
  const [metadata, setMetadata] = useState<NovelMetadata | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);

  const [options, setOptions] = useState<EpubOptions>({
    fontFamily: 'serif',
    indentStyle: 'indent',
    includeCover: true,
    publisher: 'MyDramaNovel'
  });

  const [progress, setProgress] = useState<BuildProgress>({
    status: 'idle',
    currentStep: '',
    percent: 0
  });

  const [logs, setLogs] = useState<LogMessage[]>([]);

  React.useEffect(() => {
    setLogs([
      {
        id: 'init',
        timestamp: new Date().toLocaleTimeString(),
        text: 'Novel to EPUB Client ready. Paste a novel URL to begin.',
        type: 'info'
      }
    ]);
  }, []);

  const addLog = (text: string, type: LogMessage['type'] = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        text,
        type
      }
    ]);
  };

  const handleFetch = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setProgress({
      status: 'fetching_meta',
      currentStep: 'Querying WordPress REST API...',
      percent: 10
    });
    addLog(`Starting fetch for: ${url}`);

    try {
      const meta = await fetchNovelMetadata(url);
      setMetadata(meta);
      addLog(
        `Found novel: "${meta.title}" (${meta.totalChapters} chapters listed)`,
        'success'
      );

      setProgress({
        status: 'fetching_chapters',
        currentStep: 'Fetching chapters batch by batch...',
        percent: 25
      });
      addLog(`Loading chapters via direct REST API...`);

      const { chapters: loadedChapters, coverUrl } = await fetchAllChapters(
        meta.categoryId,
        (loaded, total) => {
          const pct = Math.min(
            85,
            Math.round(25 + (loaded / Math.max(1, total)) * 60)
          );
          setProgress({
            status: 'fetching_chapters',
            currentStep: `Loaded ${loaded}/${total} chapters...`,
            percent: pct
          });
        }
      );

      if (coverUrl && !meta.coverUrl) {
        meta.coverUrl = coverUrl;
        setMetadata({ ...meta, coverUrl });
      }

      setChapters(loadedChapters);
      setProgress({
        status: 'idle',
        currentStep: `Loaded all ${loadedChapters.length} chapters!`,
        percent: 100
      });
      addLog(
        `Loaded ${loadedChapters.length} chapters successfully into client memory!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setProgress({
        status: 'error',
        currentStep: 'Fetch failed',
        percent: 0,
        message: msg
      });
      addLog(`Error during fetch: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChapter = (index: number) => {
    setChapters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], selected: !next[index].selected };
      return next;
    });
  };

  const handleToggleAll = (selected: boolean) => {
    setChapters((prev) => prev.map((c) => ({ ...c, selected })));
  };

  const handleGenerate = async () => {
    if (!metadata) return;
    const selectedChapters = chapters.filter((c) => c.selected);
    if (selectedChapters.length === 0) {
      alert('Please select at least one chapter.');
      return;
    }

    setIsBuilding(true);
    setProgress({
      status: 'building',
      currentStep: 'Compiling EPUB on device...',
      percent: 5
    });
    addLog(
      `Building EPUB for "${metadata.title}" with ${selectedChapters.length} chapters...`
    );

    const t0 = Date.now();

    try {
      const blob = await buildEpubBlob(
        metadata,
        selectedChapters,
        options,
        (percent, stepText) => {
          setProgress({
            status: 'building',
            currentStep: stepText,
            percent
          });
        }
      );

      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);

      const cleanFileName = `${metadata.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_ ]/g, '').trim()}.epub`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = cleanFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setProgress({
        status: 'done',
        currentStep: `EPUB Ready (${sizeMb} MB in ${elapsed}s)`,
        percent: 100,
        message: `Saved to your Downloads folder: ${cleanFileName}`
      });

      addLog(
        `Generated and downloaded "${cleanFileName}" (${sizeMb} MB) in ${elapsed}s!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Build failed';
      setProgress({
        status: 'error',
        currentStep: 'EPUB generation failed',
        percent: 0,
        message: msg
      });
      addLog(`Error during build: ${msg}`, 'error');
    } finally {
      setIsBuilding(false);
    }
  };

  const selectedCount = chapters.filter((c) => c.selected).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2 py-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Web Novel to EPUB Converter
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Convert serialized web novels into polished, e-reader ready EPUB books.
            All processing is computed <strong className="text-indigo-400">client-side</strong> on your device.
          </p>
        </div>

        <UrlInput
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          onFetch={handleFetch}
        />

        {metadata && (
          <NovelMetadataCard metadata={metadata} onChange={setMetadata} />
        )}

        {chapters.length > 0 && (
          <ChapterSelector
            chapters={chapters}
            onToggle={handleToggleChapter}
            onToggleAll={handleToggleAll}
          />
        )}

        {chapters.length > 0 && (
          <EpubOptionsCard
            options={options}
            setOptions={setOptions}
            onGenerate={handleGenerate}
            isBuilding={isBuilding}
            selectedCount={selectedCount}
          />
        )}

        <ProgressBar progress={progress} />

        <LogViewer logs={logs} />
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>100% In-Browser Computation • Next.js TypeScript • Ready to Deploy to Vercel</p>
      </footer>
    </div>
  );
}
