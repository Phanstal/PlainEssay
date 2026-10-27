import { describe, expect, it } from 'vitest';
import {
  countWords,
  displayTitle,
  filenameFor,
  formatUpdatedAt,
  previewLabel,
} from '../../src/domain/essay';

describe('countWords', () => {
  it('counts latin words the way the prototype does', () => {
    expect(countWords('A quiet place for ideas. ')).toBe(5);
    expect(countWords('First line with style and more.')).toBe(6);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('handles contractions and hyphenated words as one token', () => {
    expect(countWords("Don't stop co-operating.")).toBe(3);
  });

  it('counts CJK characters individually', () => {
    expect(countWords('你好世界')).toBe(4);
    expect(countWords('Hello 世界')).toBe(3);
    expect(countWords('日本語の文章')).toBe(6);
  });
});

describe('displayTitle', () => {
  it('falls back to Untitled Essay for blank titles', () => {
    expect(displayTitle('  ')).toBe('Untitled Essay');
    expect(displayTitle('A real title')).toBe('A real title');
  });
});

describe('formatUpdatedAt', () => {
  const now = new Date(2026, 9, 27, 18, 0, 0).getTime();

  it('formats today and yesterday', () => {
    expect(formatUpdatedAt(new Date(2026, 9, 27, 2, 7).getTime(), now)).toBe('Today, 2:07 AM');
    expect(formatUpdatedAt(new Date(2026, 9, 26, 14, 7).getTime(), now)).toBe('Yesterday, 2:07 PM');
  });

  it('formats older dates with a month and day', () => {
    expect(formatUpdatedAt(new Date(2026, 8, 2, 9, 5).getTime(), now)).toBe('Sep 2, 9:05 AM');
    expect(formatUpdatedAt(new Date(2025, 8, 2, 21, 15).getTime(), now)).toBe(
      'Sep 2, 2025, 9:15 PM',
    );
  });
});

describe('previewLabel and filenameFor', () => {
  it('uses singular and plural word labels', () => {
    expect(previewLabel(1)).toBe('1 word');
    expect(previewLabel(3)).toBe('3 words');
  });

  it('builds safe export filenames', () => {
    expect(filenameFor('A Quiet Morning', 'md')).toBe('A Quiet Morning.md');
    expect(filenameFor('  ', 'docx')).toBe('Untitled Essay.docx');
    expect(filenameFor('A/B: "test"', 'md')).toBe('A-B- -test-.md');
  });
});
