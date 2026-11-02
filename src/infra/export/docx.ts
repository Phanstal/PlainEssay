import { AlignmentType, Document, ImageRun, Packer, Paragraph, TextRun, UnderlineType } from 'docx';
import { displayTitle } from '../../domain/essay';
import {
  DEFAULT_DOCX_EXPORT_OPTIONS,
  lineSpacingTwips,
  paperSizeFor,
  typefaceFor,
  type DocxExportOptions,
} from './exportSettings';
import { fitImageWithin, parseImageDataUrl } from './image';
import { smartQuotes } from './smartQuotes';

const FIRST_LINE_INDENT = 720; // twips, i.e. 0.5 inch
const PAGE_MARGIN = 1440; // twips, i.e. 1 inch
const MAX_IMAGE_WIDTH = 600;
const MAX_IMAGE_HEIGHT = 700;

interface InlineStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function paragraphSpacing(options: DocxExportOptions) {
  return { after: 0, line: lineSpacingTwips(options.lineSpacing) };
}

function textRun(text: string, style: InlineStyle, options: DocxExportOptions): TextRun {
  const typeface = typefaceFor(options.typeface);
  return new TextRun({
    text: smartQuotes(text),
    font: typeface.font,
    size: typeface.size,
    color: '000000',
    bold: style.bold || undefined,
    italics: style.italic || undefined,
    underline: style.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function runsForNode(node: Node, style: InlineStyle, options: DocxExportOptions): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    return text.length === 0 ? [] : [textRun(text, style, options)];
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

  return Array.from(element.childNodes).flatMap((child) => runsForNode(child, nextStyle, options));
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

function imageParagraph(element: HTMLElement, options: DocxExportOptions): Paragraph | null {
  const image = parseImageDataUrl(element.getAttribute('src') ?? '');
  if (!image || !image.type) {
    return null;
  }
  const transformation = fitImageWithin(
    image.width,
    image.height,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
  );
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: paragraphSpacing(options),
    children: [
      new ImageRun({
        data: image.bytes,
        type: image.type,
        transformation,
      }),
    ],
  });
}

function textParagraph(children: TextRun[], options: DocxExportOptions): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: paragraphSpacing(options),
    indent: { firstLine: FIRST_LINE_INDENT },
    children,
  });
}

async function paragraphForBlock(
  node: Node,
  options: DocxExportOptions,
): Promise<Paragraph | null> {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (text.trim().length === 0) {
      return null;
    }
    return textParagraph([textRun(text, {}, options)], options);
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();
  if (tag === 'br') {
    return textParagraph([new TextRun({ break: 1 })], options);
  }

  if (tag === 'img') {
    return imageParagraph(element, options);
  }

  const images = element.querySelectorAll('img');
  if (images.length > 0) {
    return imageParagraph(images[0] as HTMLElement, options);
  }

  return textParagraph(
    Array.from(element.childNodes).flatMap((child) => runsForNode(child, {}, options)),
    options,
  );
}

export async function essayToDocxBlob(
  title: string,
  contentHtml: string,
  options: DocxExportOptions = DEFAULT_DOCX_EXPORT_OPTIONS,
): Promise<Blob> {
  const typeface = typefaceFor(options.typeface);
  const page = paperSizeFor(options.paperSize);
  const titleText = smartQuotes(displayTitle(title).replace(/\s+/g, ' '));

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: paragraphSpacing(options),
    children: [
      new TextRun({
        text: titleText,
        font: typeface.font,
        size: typeface.size,
        color: '000000',
      }),
    ],
  });

  const bodyParagraphs = (
    await Promise.all(parseBlocks(contentHtml).map((node) => paragraphForBlock(node, options)))
  ).filter((paragraph): paragraph is Paragraph => paragraph !== null);

  const document = new Document({
    creator: 'Plain',
    title: titleText,
    styles: {
      default: {
        document: {
          run: { font: typeface.font, size: typeface.size, color: '000000' },
          paragraph: { spacing: paragraphSpacing(options) },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: page.width, height: page.height },
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        children: [titleParagraph, ...bodyParagraphs],
      },
    ],
  });

  return Packer.toBlob(document);
}
