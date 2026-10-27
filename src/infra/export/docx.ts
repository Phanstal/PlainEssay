import { AlignmentType, Document, Packer, Paragraph, TextRun, UnderlineType } from 'docx';
import { displayTitle } from '../../domain/essay';

const FONT = 'Times New Roman';
const FONT_SIZE = 24; // half-points, i.e. 12pt
const DOUBLE_SPACING = { after: 0, line: 480 };

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function runsForNode(node: Node, style: InlineStyle): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (text.length === 0) {
      return [];
    }
    return [
      new TextRun({
        text,
        font: FONT,
        size: FONT_SIZE,
        color: '000000',
        bold: style.bold || undefined,
        italics: style.italic || undefined,
        underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
      }),
    ];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === 'br') {
    return [new TextRun({ break: 1 })];
  }

  const nextStyle: InlineStyle = { ...style };
  if (tag === 'b' || tag === 'strong') {
    nextStyle.bold = true;
  }
  if (tag === 'i' || tag === 'em') {
    nextStyle.italic = true;
  }
  if (tag === 'u') {
    nextStyle.underline = true;
  }

  return Array.from(element.childNodes).flatMap((child) => runsForNode(child, nextStyle));
}

function parseBlocks(contentHtml: string): Array<Node> {
  if (typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(
      `<body>${contentHtml || ''}</body>`,
      'text/html',
    );
    return Array.from(document.body.childNodes);
  }
  return [];
}

function paragraphForBlock(node: Node): Paragraph | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (text.trim().length === 0) {
      return null;
    }
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: DOUBLE_SPACING,
      children: [new TextRun({ text, font: FONT, size: FONT_SIZE, color: '000000' })],
    });
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === 'br') {
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: DOUBLE_SPACING,
      children: [new TextRun({ break: 1 })],
    });
  }

  const runs = Array.from(element.childNodes).flatMap((child) => runsForNode(child, {}));
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: DOUBLE_SPACING,
    children: runs,
  });
}

export async function essayToDocxBlob(title: string, contentHtml: string): Promise<Blob> {
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: DOUBLE_SPACING,
    children: [
      new TextRun({
        text: displayTitle(title).replace(/\s+/g, ' '),
        font: FONT,
        size: FONT_SIZE,
        color: '000000',
      }),
    ],
  });

  const bodyParagraphs = parseBlocks(contentHtml)
    .map(paragraphForBlock)
    .filter((paragraph): paragraph is Paragraph => paragraph !== null);

  const document = new Document({
    creator: 'PlainEssay',
    title: displayTitle(title),
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [titleParagraph, ...bodyParagraphs],
      },
    ],
  });

  return Packer.toBlob(document);
}
