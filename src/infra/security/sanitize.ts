import DOMPurify from 'dompurify';

/**
 * The editor schema already constrains what can be created, but stored HTML is
 * still treated as untrusted input (older builds, hand-edited databases, future
 * imports). Keep only the inline structure PlainEssay can render and export.
 */
const ALLOWED_TAGS = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'img'];
const ALLOWED_ATTR = ['src', 'alt', 'title'];
const LOCAL_IMAGE_SRC = /^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'IMG') {
    return;
  }
  const src = node.getAttribute('src') ?? '';
  if (!LOCAL_IMAGE_SRC.test(src)) {
    node.remove();
    return;
  }
  if (node.getAttribute('alt') === null) {
    node.setAttribute('alt', '');
  }
});

export function sanitizeEssayHtml(html: string): string {
  if (!html) {
    return '';
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_DATA_URI_TAGS: ['img'],
  });
}
