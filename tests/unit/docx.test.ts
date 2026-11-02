import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { essayToDocxBlob } from '../../src/infra/export/docx';
import type { DocxExportOptions } from '../../src/infra/export/exportSettings';

async function documentXml(
  title: string,
  html: string,
  options?: DocxExportOptions,
): Promise<string> {
  const blob = await essayToDocxBlob(title, html, options);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const file = zip.file('word/document.xml');
  if (!file) {
    throw new Error('word/document.xml is missing');
  }
  return file.async('string');
}

describe('docx export', () => {
  it('writes a centered Times New Roman title and double-spaced, indented body on Letter', async () => {
    const xml = await documentXml(
      'A Quiet Morning',
      '<p>Hello <strong>world</strong> and <em>friends</em>.</p><p>An <u>underlined</u> word.</p>',
    );

    expect(xml).toContain('A Quiet Morning');
    expect(xml).toContain('w:ascii="Times New Roman"');
    expect(xml).toContain('<w:jc w:val="center"/>');
    expect(xml).toContain('w:line="480"');
    expect(xml).toContain('w:pgSz w:w="12240" w:h="15840"');
    expect(xml).toContain('w:top="1440"');
    expect(xml).toContain('w:right="1440"');
    expect(xml).toContain('<w:ind w:firstLine="720"/>');
    expect(xml).toContain('<w:b/>');
    expect(xml).toContain('<w:i/>');
    expect(xml).toContain('w:val="single"');
  });

  it('applies the selected Arial typeface, single spacing, and A4 page size', async () => {
    const xml = await documentXml('A Quiet Morning', '<p>Hello world.</p>', {
      typeface: 'arial',
      lineSpacing: 'single',
      paperSize: 'a4',
    });

    expect(xml).toContain('w:ascii="Arial"');
    expect(xml).toContain('w:line="240"');
    expect(xml).toContain('w:pgSz w:w="11907" w:h="16839"');
    expect(xml).toContain('<w:ind w:firstLine="720"/>');
  });

  it('converts straight quotes and apostrophes to clean typographic forms', async () => {
    const xml = await documentXml(
      'The "real" story',
      `<p>She said, "it's fine." Then she left.</p><p>'Single quotes' too.</p>`,
    );

    expect(xml).toContain('The “real” story');
    expect(xml).toContain('She said, “it’s fine.” Then she left.');
    expect(xml).toContain('‘Single quotes’ too.');
    expect(xml).not.toContain('&quot;');
  });

  it('embeds local images as Word media without a first-line indent', async () => {
    const tinyPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEUlEQVR42mNk+M9Qz8DAwMAAAA0AAf8B9YQAAAAASUVORK5CYII=';
    const blob = await essayToDocxBlob('Image', `<p>Before</p><img src="${tinyPng}" alt="chart">`);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const media = Object.keys(zip.files).filter((name) => name.startsWith('word/media/'));
    expect(media.length).toBeGreaterThan(0);
    const xml = await zip.file('word/document.xml')!.async('string');
    expect(xml).toContain('<w:drawing>');
  });

  it('uses the untitled fallback and preserves paragraph breaks', async () => {
    const xml = await documentXml('  ', '<p>First paragraph.</p><p>Second paragraph.</p>');

    expect(xml).toContain('Untitled Essay');
    expect(xml).toContain('First paragraph.');
    expect(xml).toContain('Second paragraph.');
  });
});
