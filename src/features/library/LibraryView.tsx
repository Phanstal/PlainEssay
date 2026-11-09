import { useCallback, useEffect, useState } from 'react';
import { displayTitle, formatUpdatedAt, previewLabel, type EssaySummary } from '../../domain/essay';
import type { EssayRepository } from '../../domain/repository';

interface LibraryViewProps {
  repository: EssayRepository;
  revision: number;
  onCreate: () => Promise<void>;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = useCallback(
    async (essay: EssaySummary) => {
      const title = displayTitle(essay.title);
      if (!window.confirm(`Delete “${title}”? This action cannot be undone.`)) {
        return;
      }
      setDeletingId(essay.id);
      try {
        await onDelete(essay.id);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Could not delete essay.');
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete],
  );

  return (
    <main className="home-shell">
      <section className="library">
        <div className="library-heading">
          <div>
            <span className="eyebrow">Your writing space</span>
            <h1>Essays</h1>
          </div>
          <div className="library-actions">
            <button
              type="button"
              className="new-button"
              onClick={() => void handleCreate()}
            >
              New essay <span aria-hidden="true">＋</span>
            </button>
          </div>
        </div>

        {loadError ? <p className="library-error">{loadError}</p> : null}

        {essays === null ? (
          <p className="library-loading">Loading essays…</p>
        ) : essays.length === 0 ? (
          <button type="button" className="empty-state" onClick={() => void handleCreate()}>
            <span className="empty-plus" aria-hidden="true">
              ＋
            </span>
            <strong>Start a new essay</strong>
            <span>A quiet page is ready when you are.</span>
          </button>
        ) : (
          <div className="document-list">
            {essays.map((essay) => {
              const title = displayTitle(essay.title);
              return (
                <div className="document-item" key={essay.id}>
                  <button
                    type="button"
                    className="document-row"
                    onClick={() => onOpen(essay.id)}
                  >
                    <span className="document-glyph" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="document-info">
                      <strong>{title}</strong>
                      <span>{previewLabel(essay.wordCount)}</span>
                    </span>
                    <time dateTime={new Date(essay.updatedAt).toISOString()}>
                      {formatUpdatedAt(essay.updatedAt)}
                    </time>
                  </button>
                  <div className="document-actions" aria-label={`Actions for ${title}`}>
                    <button
                      type="button"
                      aria-label={`Edit ${title}`}
                      onClick={() => onOpen(essay.id)}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4 14.8V17h2.2L15 8.2 11.8 5 3 13.8Z" />
                        <path d="m13 3.8 3.2 3.2" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="delete-action"
                      aria-label={`Delete ${title}`}
                      onClick={() => void handleDelete(essay)}
                      disabled={deletingId === essay.id}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M4.5 6.5h11M8 3.5h4l1 3H7l1-3Z" />
                        <path d="m6 6.5.7 10h6.6l.7-10M8.5 9v4.5M11.5 9v4.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
