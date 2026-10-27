import DOMPurify from 'dompurify';

/**
 * The editor schema already constrains what can be created, but stored HTML is
 * still treated as untrusted input (older builds, hand-edited databases, future
 * imports). Keep only the inline structure PlainEssay can render and export.
 */
const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u'];

export function sanitizeEssayHtml(html: string): string {
  if (!html) {
    return '';
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });
}
