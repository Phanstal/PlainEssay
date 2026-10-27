import { useCallback, useEffect, useState } from 'react';
import { displayTitle, formatUpdatedAt, previewLabel, type EssaySummary } from '../../domain/essay';
import type { EssayRepository } from '../../domain/repository';
import { ConfirmDialog } from './ConfirmDialog';

interface LibraryViewProps {
  repository: EssayRepository;
  revision: number;
  onCreate: () => Promise<void>;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

interface RowMenu {
  id: string;
  x: number;
  y: number;
}

export function LibraryView({
  repository,
  revision,
  onCreate,
  onOpen,
  onDelete,
}: LibraryViewProps) {
  const [essays, setEssays] = useState<EssaySummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<RowMenu | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EssaySummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    repository
      .list()
      .then((loaded) => {
        if (alive) {
          setLoadError(null);
          setEssays(loaded);
        }
      })
      .catch((error: unknown) => {
        if (alive) {
          setLoadError(error instanceof Error ? error.message : 'Could not load essays.');
        }
      });
    return () => {
      alive = false;
    };
  }, [repository, revision]);

  useEffect(() => {
    if (!menu) {
      return;
    }
    const dismiss = () => setMenu(null);
    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('keydown', dismiss);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [menu]);

  const handleCreate = useCallback(async () => {
    if (creating) {
      return;
    }
    setCreating(true);
    try {
      await onCreate();
    } finally {
      setCreating(false);
    }
  }, [creating, onCreate]);

  const openMenuFromButton = useCallback((event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenu({ id, x: rect.right - 8, y: rect.bottom + 6 });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }, [onDelete, pendingDelete]);

  const count = essays?.length ?? 0;

  return (
    <div className="home-shell">
      <header className="home-nav" data-tauri-drag-region>
        <span className="wordmark">plainessay</span>
        <button
          type="button"
          className="new-button"
          onClick={() => void handleCreate()}
          disabled={creating}
        >
          New essay <span aria-hidden="true">＋</span>
        </button>
      </header>

      <section className="library">
        <div className="library-heading">
          <div>
            <span className="eyebrow">Your writing space</span>
            <h1>Essays</h1>
          </div>
          <span className="document-total">
            {count} {count === 1 ? 'document' : 'documents'}
          </span>
        </div>

        {loadError ? <p className="library-error">{loadError}</p> : null}

        {essays === null ? (
          <p className="library-loading">Loading essays…</p>
        ) : essays.length === 0 ? (
          <button type="button" className="empty-state" onClick={() => void handleCreate()}>
            <span className="empty-plus" aria-hidden="true">
              ＋
            </span>
            <strong>No essays yet</strong>
            <span>Start with a quiet page.</span>
          </button>
        ) : (
          <div className="document-list">
            {essays.map((essay) => (
              <div
                key={essay.id}
                className="document-row"
                role="button"
                tabIndex={0}
                aria-label={`Open ${displayTitle(essay.title)}`}
                onClick={() => onOpen(essay.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(essay.id);
                  }
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenu({ id: essay.id, x: event.clientX, y: event.clientY });
                }}
              >
                <span className="document-glyph" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="document-info">
                  <strong>{displayTitle(essay.title)}</strong>
                  <span>{previewLabel(essay.wordCount)}</span>
                </span>
                <time dateTime={new Date(essay.updatedAt).toISOString()}>
                  {formatUpdatedAt(essay.updatedAt)}
                </time>
                <span className="row-arrow" aria-hidden="true">
                  →
                </span>
                <button
                  type="button"
                  className="row-menu"
                  aria-label={`More options for ${displayTitle(essay.title)}`}
                  onClick={(event) => openMenuFromButton(event, essay.id)}
                >
                  ⋯
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {menu ? (
        <div
          className="context-menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              const target = essays?.find((essay) => essay.id === menu.id) ?? null;
              setMenu(null);
              setPendingDelete(target);
            }}
          >
            Delete
          </button>
        </div>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete essay?"
          message={`“${displayTitle(pendingDelete.title)}” will be removed from this Mac. This cannot be undone.`}
          confirmLabel="Delete"
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}
