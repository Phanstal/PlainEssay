import { describe, expect, it } from 'vitest';
import { essayToMarkdown } from '../../src/infra/export/markdown';

describe('markdown export', () => {
  it('renders a title heading and formatted body text', () => {
    const markdown = essayToMarkdown(
      'A Quiet Morning',
      '<p>Hello <strong>world</strong> and <em>friends</em>.</p><p>Second line.</p>',
    );

    expect(markdown).toBe('# A Quiet Morning\n\nHello **world** and *friends*.\n\nSecond line.\n');
  });

  it('keeps underline emphasis as inline HTML instead of dropping it', () => {
    const markdown = essayToMarkdown('Title', '<p>An <u>underlined</u> word.</p>');
    expect(markdown).toContain('An <u>underlined</u> word.');
  });

  it('does not produce broken emphasis markers around bold text', () => {
    const markdown = essayToMarkdown(
      'Title',
      '<p>First line with <strong>style</strong> and more.</p>',
    );
    expect(markdown).toContain('First line with **style** and more.');
    expect(markdown).not.toContain('**First line with **');
  });

  it('falls back to an untitled heading and handles empty bodies', () => {
    expect(essayToMarkdown('', '')).toBe('# Untitled Essay\n');
    expect(essayToMarkdown('Only a title', '<p></p>')).toBe('# Only a title\n');
  });
});
