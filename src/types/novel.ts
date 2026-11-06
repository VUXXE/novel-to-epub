export interface Chapter {
  id: number;
  num: number;
  title: string;
  slug: string;
  contentHtml: string;
  selected: boolean;
}

export interface NovelMetadata {
  slug: string;
  url: string;
  categoryId: number;
  title: string;
  originalTitle: string;
  author: string;
  synopsis: string;
  coverUrl: string;
  totalChapters: number;
}

export type FontOption = 'serif' | 'sans-serif';
export type IndentOption = 'indent' | 'spaced';

export interface EpubOptions {
  fontFamily: FontOption;
  indentStyle: IndentOption;
  includeCover: boolean;
  publisher: string;
}

export interface BuildProgress {
  status: 'idle' | 'fetching_meta' | 'fetching_chapters' | 'building' | 'done' | 'error';
  currentStep: string;
  percent: number;
  currentChapter?: number;
  totalChapters?: number;
  message?: string;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'warn' | 'error';
}
