import { useEffect, useState } from 'react';
import {
  LINE_SPACING_OPTIONS,
  PAPER_SIZE_OPTIONS,
  TYPEFACE_OPTIONS,
  type DocxExportOptions,
  type ExportLineSpacing,
  type ExportPaperSize,
  type ExportTypeface,
} from '../../infra/export/exportSettings';

interface ExportDialogProps {
  value: DocxExportOptions;
  busy: boolean;
  onChange: (value: DocxExportOptions) => void;
  onCancel: () => void;
  onExport: () => void;
}

const EXPORT_NOTICE_STORAGE_KEY = 'plain-hide-export-notice';

function hasHiddenExportNotice(): boolean {
  try {
    return window.localStorage.getItem(EXPORT_NOTICE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberHiddenExportNotice(): void {
  try {
    window.localStorage.setItem(EXPORT_NOTICE_STORAGE_KEY, '1');
  } catch {
    // The notice is a convenience; exporting must still work if storage is unavailable.
  }
}

export function ExportDialog({ value, busy, onChange, onCancel, onExport }: ExportDialogProps) {
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [rememberNotice, setRememberNotice] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (noticeOpen) {
          setNoticeOpen(false);
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [noticeOpen, onCancel]);

  const requestExport = () => {
    if (hasHiddenExportNotice()) {
      onExport();
      return;
    }
    setNoticeOpen(true);
  };

  const confirmExport = () => {
    if (rememberNotice) {
      rememberHiddenExportNotice();
    }
    setNoticeOpen(false);
    onExport();
  };

  return (
    <>
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
              <select
                aria-label="Export typeface"
                value={value.typeface}
                disabled={busy}
                onChange={(event) =>
                  onChange({ ...value, typeface: event.target.value as ExportTypeface })
                }
              >
                {TYPEFACE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Line spacing</span>
              <select
                aria-label="Export line spacing"
                value={value.lineSpacing}
                disabled={busy}
                onChange={(event) =>
                  onChange({ ...value, lineSpacing: event.target.value as ExportLineSpacing })
                }
              >
                {LINE_SPACING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
              onClick={requestExport}
              disabled={busy}
            >
              Export .docx
            </button>
          </div>
        </section>
      </div>

      {noticeOpen ? (
        <div className="export-overlay export-warning-overlay">
          <section
            className="export-dialog export-warning"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="export-warning-title"
          >
            <div className="export-dialog-heading">
              <div>
                <span className="export-kicker">Before you export</span>
                <h2 id="export-warning-title">Review in Word before submitting</h2>
              </div>
            </div>
            <p>
              Plain provides document pre-formatting. Microsoft Word rendering and your assignment
              requirements may differ slightly, so please review the exported file in Word before
              submission.
            </p>
            <label className="warning-check">
              <input
                type="checkbox"
                checked={rememberNotice}
                onChange={(event) => setRememberNotice(event.target.checked)}
              />
              <span>Don’t remind me again</span>
            </label>
            <div className="export-dialog-actions">
              <button type="button" className="dialog-cancel" onClick={() => setNoticeOpen(false)}>
                Go back
              </button>
              <button
                type="button"
                className="export-button dialog-export"
                onClick={confirmExport}
                disabled={busy}
              >
                Confirm &amp; export
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
