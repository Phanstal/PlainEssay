import { describe, expect, it } from 'vitest';
import { sanitizeEssayHtml } from '../../src/infra/security/sanitize';

describe('sanitizeEssayHtml', () => {
  it('keeps the inline structure Plain renders and exports', () => {
    expect(
      sanitizeEssayHtml('<p>Hello <strong>world</strong> and <em>friends</em> <u>now</u>.</p>'),
    ).toBe('<p>Hello <strong>world</strong> and <em>friends</em> <u>now</u>.</p>');
  });

  it('drops scripts, images, and event handler attributes', () => {
    const sanitized = sanitizeEssayHtml(
      '<p onclick="alert(1)">Safe<script>alert(2)</script><img src="x" onerror="alert(3)"></p>',
    );

    expect(sanitized).toContain('<p>Safe</p>');
    expect(sanitized).not.toContain('script');
    expect(sanitized).not.toContain('img');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('onerror');
  });

  it('keeps local image data but strips remote image sources', () => {
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEUlEQVR42mNk+M9Qz8DAwMAAAA0AAf8B9YQAAAAASUVORK5CYII=';
    expect(sanitizeEssayHtml(`<p>One</p><img src="${tinyPng}" alt="chart">`)).toBe(
      `<p>One</p><img src="${tinyPng}" alt="chart">`,
    );
    expect(sanitizeEssayHtml('<img src="https://example.com/tracker.png">')).toBe('');
    expect(sanitizeEssayHtml('<img src="data:image/svg+xml;base64,PHN2Zz4=">')).toBe('');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeEssayHtml('')).toBe('');
  });
});
