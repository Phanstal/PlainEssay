import { filenameFor, type Essay } from '../../domain/essay';
import { essayToDocxBlob } from './docx';
import { essayToMarkdown } from './markdown';
import { saveFile } from './saveFile';

export async function exportEssayAsMarkdown(essay: Essay): Promise<boolean> {
  const result = await saveFile({
    defaultName: filenameFor(essay.title, 'md'),
    data: essayToMarkdown(essay.title, essay.contentHtml),
    mimeType: 'text/markdown;charset=utf-8',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  return result === 'saved';
}

export async function exportEssayAsDocx(essay: Essay): Promise<boolean> {
  const blob = await essayToDocxBlob(essay.title, essay.contentHtml);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const result = await saveFile({
    defaultName: filenameFor(essay.title, 'docx'),
    data: bytes,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
  });
  return result === 'saved';
}
