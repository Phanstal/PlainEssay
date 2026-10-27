export const UNTITLED_TITLE = 'Untitled Essay';

export interface Essay {
  id: string;
  title: string;
  contentHtml: string;
  plainText: string;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export type EssaySummary = Pick<Essay, 'id' | 'title' | 'wordCount' | 'updatedAt'>;

export function displayTitle(title: string): string {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : UNTITLED_TITLE;
}

const LATIN_WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const CJK_CHAR = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/gu;

/**
 * Counts words the way the prototype does for latin text (whitespace separated
 * tokens, including punctuation-adjacent words), and counts CJK characters
 * individually because those writing systems do not use spaces between words.
 */
export function countWords(text: string): number {
  if (!text) {
    return 0;
  }

  const cjkCount = text.match(CJK_CHAR)?.length ?? 0;
  const withoutCjk = text.replace(CJK_CHAR, ' ');
  const latinCount = withoutCjk.match(LATIN_WORD)?.length ?? 0;
  return cjkCount + latinCount;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(date: Date): string {
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = date.getHours() >= 12 ? 'PM' : 'AM';
  return `${hours}:${minutes} ${suffix}`;
}

/** Matches the prototype's "Today, 2:07 AM" style timestamps. */
export function formatUpdatedAt(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const current = new Date(now);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const dayDifference = Math.round((startOfDay(current) - startOfDay(date)) / 86_400_000);
  const time = formatTime(date);

  if (dayDifference === 0) {
    return `Today, ${time}`;
  }
  if (dayDifference === 1) {
    return `Yesterday, ${time}`;
  }

  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const year = date.getFullYear() === current.getFullYear() ? '' : `, ${date.getFullYear()}`;
  return `${monthDay}${year}, ${time}`;
}

export function filenameFor(title: string, extension: 'md' | 'docx'): string {
  const base = displayTitle(title)
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  return `${base || UNTITLED_TITLE}.${extension}`;
}

export function previewLabel(count: number): string {
  return `${count} ${count === 1 ? 'word' : 'words'}`;
}
