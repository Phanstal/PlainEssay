export type ExportTypeface = 'times' | 'arial';
export type ExportLineSpacing = 'double' | 'single';
export type ExportPaperSize = 'letter' | 'a4';

export interface DocxExportOptions {
  typeface: ExportTypeface;
  lineSpacing: ExportLineSpacing;
  paperSize: ExportPaperSize;
}

export const DEFAULT_DOCX_EXPORT_OPTIONS: DocxExportOptions = {
  typeface: 'times',
  lineSpacing: 'double',
  paperSize: 'letter',
};

export const TYPEFACE_OPTIONS: ReadonlyArray<{
  value: ExportTypeface;
  label: string;
  font: string;
  size: number;
}> = [
  { value: 'times', label: 'Times New Roman · 12 pt', font: 'Times New Roman', size: 24 },
  { value: 'arial', label: 'Arial · 12 pt', font: 'Arial', size: 24 },
];

export const LINE_SPACING_OPTIONS: ReadonlyArray<{
  value: ExportLineSpacing;
  label: string;
  twips: number;
}> = [
  { value: 'double', label: 'Double-spaced', twips: 480 },
  { value: 'single', label: 'Single-spaced', twips: 240 },
];

export const PAPER_SIZE_OPTIONS: ReadonlyArray<{
  value: ExportPaperSize;
  label: string;
  width: number;
  height: number;
}> = [
  { value: 'letter', label: 'US Letter · 8.5 × 11 in', width: 12240, height: 15840 },
  { value: 'a4', label: 'A4 · 210 × 297 mm', width: 11907, height: 16839 },
];

export function typefaceFor(typeface: ExportTypeface) {
  return TYPEFACE_OPTIONS.find((option) => option.value === typeface) ?? TYPEFACE_OPTIONS[0];
}

export function lineSpacingTwips(lineSpacing: ExportLineSpacing): number {
  return (
    LINE_SPACING_OPTIONS.find((option) => option.value === lineSpacing)?.twips ??
    LINE_SPACING_OPTIONS[0].twips
  );
}

export function paperSizeFor(paperSize: ExportPaperSize) {
  return PAPER_SIZE_OPTIONS.find((option) => option.value === paperSize) ?? PAPER_SIZE_OPTIONS[0];
}
