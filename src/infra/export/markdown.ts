import TurndownService from 'turndown';
import { displayTitle } from '../../domain/essay';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// CommonMark has no underline, so keep the inline HTML element instead of
// silently dropping the emphasis.
turndown.addRule('underline', {
  filter: 'u',
  replacement: (content) => (content ? `<u>${content}</u>` : ''),
});

export function essayToMarkdown(title: string, contentHtml: string): string {
  const heading = displayTitle(title).replace(/\s+/g, ' ');
  const body = turndown.turndown(contentHtml || '').trim();
  return body.length > 0 ? `# ${heading}\n\n${body}\n` : `# ${heading}\n`;
}
