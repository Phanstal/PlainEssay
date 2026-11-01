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

turndown.addRule('localImage', {
  filter: 'img',
  replacement: (_content, node) => {
    const element = node as HTMLImageElement;
    const src = element.getAttribute('src') ?? '';
    if (!src.startsWith('data:image/')) {
      return '';
    }
    const alt = (element.getAttribute('alt') ?? '').replace(/[[\]]/g, '');
    return `![${alt}](${src})`;
  },
});

export function essayToMarkdown(title: string, contentHtml: string): string {
  const heading = displayTitle(title).replace(/\s+/g, ' ');
  const body = turndown.turndown(contentHtml || '').trim();
  return body.length > 0 ? `# ${heading}\n\n${body}\n` : `# ${heading}\n`;
}
