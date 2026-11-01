import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { TextSelection } from '@tiptap/pm/state';
import { countWords, previewLabel, type Essay } from '../../domain/essay';
import type { EssayRepository } from '../../domain/repository';
import { exportEssayAsDocx, exportEssayAsMarkdown } from '../../infra/export/exportEssay';
import { imageFilesFromDataTransfer, readImageFile } from '../../infra/images/readImageFile';
import { sanitizeEssayHtml } from '../../infra/security/sanitize';
import { subscribeEditorCommands } from '../../platform/commands';
import { FindBar } from './FindBar';

interface EditorViewProps {
  repository: EssayRepository;
  essayId: string;
  onBack: () => void;
}

interface EssayEditorProps {
  repository: EssayRepository;
  initial: Essay;
  onBack: () => void;
}

type SaveState = 'saved' | 'saving' | 'error';
type ExportFormat = 'markdown' | 'docx';

const SAVE_DEBOUNCE_MS = 600;

export function EditorView({ repository, essayId, onBack }: EditorViewProps) {
  const [essay, setEssay] = useState<Essay | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    repository
      .get(essayId)
      .then((loaded) => {
        if (alive) {
          setLoadError(null);
          setEssay(loaded);
        }
      })
      .catch((error: unknown) => {
        if (alive) {
          setLoadError(error instanceof Error ? error.message : 'Could not open this essay.');
        }
      });
    return () => {
      alive = false;
    };
  }, [repository, essayId]);

  if (loadError) {
    return (
      <div className="app-loading">
        <span className="wordmark">plainessay</span>
        <p className="app-loading-message">{loadError}</p>
        <button type="button" className="secondary-export" onClick={onBack}>
          Back to essays
        </button>
      </div>
    );
  }

  if (essay === undefined) {
    return (
      <div className="app-loading">
        <span className="wordmark">plainessay</span>
        <span className="app-loading-message">Opening essay…</span>
      </div>
    );
  }

  if (essay === null) {
    return (
      <div className="app-loading">
        <span className="wordmark">plainessay</span>
        <p className="app-loading-message">This essay could not be found.</p>
        <button type="button" className="secondary-export" onClick={onBack}>
          Back to essays
        </button>
      </div>
    );
  }

  return <EssayEditor repository={repository} initial={essay} onBack={onBack} />;
}

function EssayEditor({ repository, initial, onBack }: EssayEditorProps) {
  const sanitizedHtml = sanitizeEssayHtml(initial.contentHtml);
  const [title, setTitle] = useState(initial.title);
  const [wordCount, setWordCount] = useState(initial.wordCount);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [dragActive, setDragActive] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const insertImageFilesRef = useRef<(files: File[]) => void>(() => undefined);

  const latestRef = useRef({
    title: initial.title,
    html: sanitizedHtml,
    text: initial.plainText,
    wordCount: initial.wordCount,
  });
  const dirtyRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1_800);
  }, []);

  const buildEssay = useCallback(
    (): Essay => ({
      ...initial,
      title: latestRef.current.title,
      contentHtml: latestRef.current.html,
      plainText: latestRef.current.text,
      wordCount: latestRef.current.wordCount,
      updatedAt: Date.now(),
    }),
    [initial],
  );

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }

    const essay = buildEssay();
    dirtyRef.current = false;
    setSaveState('saving');

    try {
      await repository.save(essay);
      if (!dirtyRef.current) {
        setSaveState('saved');
      }
    } catch {
      dirtyRef.current = true;
      setSaveState('error');
    }
  }, [buildEssay, repository]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveState('saving');
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      void saveNow();
    }, SAVE_DEBOUNCE_MS);
  }, [saveNow]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        listItem: false,
        code: false,
        strike: false,
        link: false,
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: 'essay-image' },
      }),
    ],
    content: sanitizedHtml || '<p></p>',
    editorProps: {
      attributes: {
        class: 'essay-body',
        spellcheck: 'true',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Essay body',
      },
      handlePaste: (_view, event) => {
        const files = imageFilesFromDataTransfer(event.clipboardData);
        if (files.length === 0) {
          return false;
        }
        event.preventDefault();
        insertImageFilesRef.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) {
          return false;
        }
        const files = imageFilesFromDataTransfer(event.dataTransfer);
        if (files.length === 0) {
          return false;
        }
        event.preventDefault();
        setDragActive(false);
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (coordinates) {
          view.dispatch(
            view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(coordinates.pos))),
          );
        }
        insertImageFilesRef.current(files);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.isEmpty ? '' : current.getHTML();
      const text = current.getText();
      const nextWordCount = countWords(text);
      latestRef.current = {
        ...latestRef.current,
        html,
        text,
        wordCount: nextWordCount,
      };
      setWordCount(nextWordCount);
      markDirty();
    },
  });

  const insertImageFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          const image = await readImageFile(file);
          editorRef.current?.chain().focus().setImage(image).run();
          showToast('Image added');
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Image could not be added');
        }
      }
    },
    [showToast],
  );

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    insertImageFilesRef.current = (files) => void insertImageFiles(files);
  }, [insertImageFiles]);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    const update = () => {
      setActiveFormats({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
      });
      setHistoryState({
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      });
      const { from, to } = editor.state.selection;
      setSelectionCount(from === to ? 0 : countWords(editor.state.doc.textBetween(from, to, ' ')));
    };
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    update();
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const applyFormat = useCallback(
    (format: 'bold' | 'italic' | 'underline') => {
      if (!editor) {
        return;
      }
      const chain = editor.chain().focus();
      if (format === 'bold') {
        chain.toggleBold().run();
      } else if (format === 'italic') {
        chain.toggleItalic().run();
      } else {
        chain.toggleUnderline().run();
      }
    },
    [editor],
  );

  const undo = useCallback(() => {
    editor?.chain().focus().undo().run();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.chain().focus().redo().run();
  }, [editor]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      latestRef.current = { ...latestRef.current, title: value };
      markDirty();
    },
    [markDirty],
  );

  const handleBack = useCallback(async () => {
    await saveNow();
    onBack();
  }, [onBack, saveNow]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (exporting) {
        return;
      }
      setExporting(true);
      await saveNow();
      try {
        const essay = buildEssay();
        const saved =
          format === 'markdown'
            ? await exportEssayAsMarkdown(essay)
            : await exportEssayAsDocx(essay);
        showToast(saved ? 'Export saved' : 'Export cancelled');
      } catch {
        showToast('Export failed');
      } finally {
        setExporting(false);
      }
    },
    [buildEssay, exporting, saveNow, showToast],
  );

  useEffect(() => {
    return subscribeEditorCommands((command) => {
      switch (command) {
        case 'bold':
          applyFormat('bold');
          break;
        case 'italic':
          applyFormat('italic');
          break;
        case 'underline':
          applyFormat('underline');
          break;
        case 'show-find':
          setFindOpen(true);
          break;
        case 'save':
          void saveNow();
          break;
        case 'export-markdown':
          void handleExport('markdown');
          break;
        case 'export-docx':
          void handleExport('docx');
          break;
        case 'back':
          void handleBack();
          break;
      }
    });
  }, [applyFormat, handleBack, handleExport, saveNow]);

  useEffect(() => {
    const onBeforeUnload = () => {
      void saveNow();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = undefined;
      }
      void saveNow();
    };
  }, [saveNow]);

  const statusLabel =
    saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Save failed';

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="brand-lockup">
          <button
            type="button"
            className="back-button"
            aria-label="Back to essays"
            onClick={() => void handleBack()}
          >
            ←
          </button>
          <span className="wordmark">plainessay</span>
          <span className={`save-status save-status-${saveState}`} aria-live="polite">
            <span className={`status-dot ${saveState}`} />
            {statusLabel}
          </span>
        </div>

        <div className="toolbar-actions">
          <span className="word-count">
            {selectionCount > 0 ? `${selectionCount} selected` : previewLabel(wordCount)}
          </span>
          <button
            type="button"
            className="secondary-export"
            onClick={() => void handleExport('markdown')}
            disabled={exporting}
          >
            Export .md
          </button>
          <button
            type="button"
            className="export-button"
            onClick={() => void handleExport('docx')}
            disabled={exporting}
          >
            Export .docx
          </button>
        </div>
      </header>

      {findOpen ? (
        <FindBar
          editor={editor}
          onClose={() => {
            setFindOpen(false);
            editor?.commands.focus();
          }}
        />
      ) : null}

      <div className="writing-stage">
        <div className="paper">
          <input
            className="essay-title"
            aria-label="Essay title"
            placeholder="Untitled Essay"
            value={title}
            maxLength={160}
            onChange={(event) => handleTitleChange(event.target.value)}
            spellCheck={false}
          />
          <div className="title-rule" aria-hidden="true" />

          <div className="formatting-toolbar" role="toolbar" aria-label="Formatting">
            <button
              type="button"
              className="format-button"
              aria-label="Undo"
              disabled={!historyState.canUndo}
              onMouseDown={(event) => event.preventDefault()}
              onClick={undo}
            >
              ↶
            </button>
            <button
              type="button"
              className="format-button"
              aria-label="Redo"
              disabled={!historyState.canRedo}
              onMouseDown={(event) => event.preventDefault()}
              onClick={redo}
            >
              ↷
            </button>
            <button
              type="button"
              className={`format-button ${activeFormats.bold ? 'active' : ''}`}
              aria-label="Bold"
              aria-pressed={activeFormats.bold}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('bold')}
            >
              B
            </button>
            <button
              type="button"
              className={`format-button format-italic ${activeFormats.italic ? 'active' : ''}`}
              aria-label="Italic"
              aria-pressed={activeFormats.italic}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('italic')}
            >
              I
            </button>
            <button
              type="button"
              className={`format-button format-underline ${activeFormats.underline ? 'active' : ''}`}
              aria-label="Underline"
              aria-pressed={activeFormats.underline}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat('underline')}
            >
              U
            </button>
          </div>

          <div
            className={`essay-body-wrap ${dragActive ? 'image-drop-active' : ''}`}
            onDragEnter={(event) => {
              if (event.dataTransfer?.types.includes('Files')) {
                event.preventDefault();
                setDragActive(true);
              }
            }}
            onDragOver={(event) => {
              if (event.dataTransfer?.types.includes('Files')) {
                event.preventDefault();
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragActive(false);
              }
            }}
            onDrop={() => setDragActive(false)}
          >
            <EditorContent editor={editor} className="essay-body-content" />
          </div>
        </div>
      </div>

      {toast ? (
        <div className="toast toast-visible" role="status">
          <span className="toast-mark" aria-hidden="true">
            ✓
          </span>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
