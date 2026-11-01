import { describe, expect, it } from 'vitest';
import { parseImageDataUrl, fitImageWithin } from '../../src/infra/export/image';

// 2x3 PNG, base64 encoded.
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEUlEQVR42mNk+M9Qz8DAwMAAAA0AAf8B9YQAAAAASUVORK5CYII=';

describe('parseImageDataUrl', () => {
  it('decodes a local PNG and reads its dimensions', () => {
    const image = parseImageDataUrl(TINY_PNG);
    expect(image).not.toBeNull();
    expect(image?.mime).toBe('image/png');
    expect(image?.type).toBe('png');
    expect(image?.width).toBe(2);
    expect(image?.height).toBe(3);
    expect(image?.bytes.length).toBeGreaterThan(0);
  });

  it('rejects remote URLs and non-image data', () => {
    expect(parseImageDataUrl('https://example.com/a.png')).toBeNull();
    expect(parseImageDataUrl('data:text/plain;base64,aGk=')).toBeNull();
  });

  it('maps WebP to no DOCX type', () => {
    const webp = parseImageDataUrl('data:image/webp;base64,aGVsbG8=');
    expect(webp?.mime).toBe('image/webp');
    expect(webp?.type).toBeNull();
  });
});

describe('fitImageWithin', () => {
  it('keeps small images at their size and scales large ones down', () => {
    expect(fitImageWithin(200, 100, 600, 700)).toEqual({ width: 200, height: 100 });
    expect(fitImageWithin(1200, 600, 600, 700)).toEqual({ width: 600, height: 300 });
    expect(fitImageWithin(100, 1400, 600, 700)).toEqual({ width: 50, height: 700 });
  });
});
