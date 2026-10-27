import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { essayToDocxBlob } from '../../src/infra/export/docx';

async function documentXml(title: string, html: string): Promise<string> {
  const blob = await essayToDocxBlob(title, html);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const file = zip.file('word/document.xml');
  if (!file) {
    throw new Error('word/document.xml is missing');
  }
  return file.async('string');
}

describe('docx export', () => {
  it('writes a centered Times New Roman title and double-spaced body', async () => {
    const xml = await documentXml(
      'A Quiet Morning',
      '<p>Hello <strong>world</strong> and <em>friends</em>.</p><p>An <u>underlined</u> word.</p>',
    );

    expect(xml).toContain('A Quiet Morning');
    expect(xml).toContain('w:ascii="Times New Roman"');
    expect(xml).toContain('<w:jc w:val="center"/>');
    expect(xml).toContain('w:line="480"');
    expect(xml).toContain('w:top="1440"');
    expect(xml).toContain('w:right="1440"');
    expect(xml).toContain('<w:b/>');
    expect(xml).toContain('<w:i/>');
    expect(xml).toContain('w:val="single"');
  });

  it('uses the untitled fallback and preserves paragraph breaks', async () => {
    const xml = await documentXml('  ', '<p>First paragraph.</p><p>Second paragraph.</p>');

    expect(xml).toContain('Untitled Essay');
    expect(xml).toContain('First paragraph.');
    expect(xml).toContain('Second paragraph.');
  });
});
