import { useEffect } from 'react';
import {
  PAPER_SIZE_OPTIONS,
  type DocxExportOptions,
  type ExportPaperSize,
} from '../../infra/export/exportSettings';

interface ExportDialogProps {
  value: DocxExportOptions;
  busy: boolean;
  onChange: (value: DocxExportOptions) => void;
  onCancel: () => void;
  onExport: () => void;
}

export function ExportDialog({ value, busy, onChange, onCancel, onExport }: ExportDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="export-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <div className="export-dialog-heading">
          <div>
            <span className="export-kicker">Microsoft Word</span>
            <h2 id="export-title">Export document</h2>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onCancel}
            aria-label="Close export settings"
          >
            ×
          </button>
        </div>

        <div className="export-fields">
          <label>
            <span>Typeface</span>
            <select aria-label="Export typeface" value="times" disabled>
              <option value="times">Times New Roman · 12 pt</option>
            </select>
          </label>

          <label>
            <span>Line spacing</span>
            <select aria-label="Export line spacing" value="double" disabled>
              <option value="double">Double-spaced</option>
            </select>
          </label>

          <label>
            <span>Paper size</span>
            <select
              aria-label="Export paper size"
              value={value.paperSize}
              disabled={busy}
              onChange={(event) =>
                onChange({ ...value, paperSize: event.target.value as ExportPaperSize })
              }
            >
              {PAPER_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="export-summary" id="export-summary">
          <span className="summary-mark" aria-hidden="true">
            ✓
          </span>
          <span>1-inch margins · 0.5-inch first-line indent · black text</span>
        </div>

        <div className="export-dialog-actions">
          <button type="button" className="dialog-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="export-button dialog-export"
            onClick={onExport}
            disabled={busy}
          >
            Export .docx
          </button>
        </div>
      </section>
    </div>
  );
}
