import { useCallback, useEffect, useState } from 'react';
import type { EssayRepository } from '../domain/repository';
import { createEssayRepository } from '../infra/storage';
import { LibraryView } from '../features/library/LibraryView';
import { EditorView } from '../features/editor/EditorView';
import { sendEditorCommand, subscribeAppCommands, type AppCommand } from '../platform/commands';

type View = { kind: 'library' } | { kind: 'editor'; id: string };

export default function App() {
  const [repository, setRepository] = useState<EssayRepository | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: 'library' });
  const [libraryRevision, setLibraryRevision] = useState(0);

  useEffect(() => {
    let alive = true;
    createEssayRepository()
      .then((created) => {
        if (alive) {
          setRepository(created);
        }
      })
      .catch((error: unknown) => {
        if (alive) {
          setInitializationError(
            error instanceof Error ? error.message : 'Could not open the local library.',
          );
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const createEssay = useCallback(async () => {
    if (!repository) {
      return;
    }
    const essay = await repository.create();
    setLibraryRevision((revision) => revision + 1);
    setView({ kind: 'editor', id: essay.id });
  }, [repository]);

  const openEssay = useCallback((id: string) => {
    setView({ kind: 'editor', id });
  }, []);

  const closeEditor = useCallback(() => {
    setView({ kind: 'library' });
    setLibraryRevision((revision) => revision + 1);
  }, []);

  const deleteEssay = useCallback(
    async (id: string) => {
      if (!repository) {
        return;
      }
      await repository.remove(id);
      setLibraryRevision((revision) => revision + 1);
    },
    [repository],
  );

  useEffect(() => {
    return subscribeAppCommands((command: AppCommand) => {
      if (command === 'new-essay') {
        void createEssay();
        return;
      }
      if (view.kind === 'editor') {
        sendEditorCommand(command);
      }
    });
  }, [createEssay, view.kind]);

  if (initializationError) {
    return (
      <div className="app-loading">
        <span className="wordmark">plainessay</span>
        <p className="app-loading-message">The local library could not be opened.</p>
        <p className="app-loading-detail">{initializationError}</p>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="app-loading">
        <span className="wordmark">plainessay</span>
        <span className="app-loading-message">Loading…</span>
      </div>
    );
  }

  if (view.kind === 'editor') {
    return (
      <EditorView key={view.id} repository={repository} essayId={view.id} onBack={closeEditor} />
    );
  }

  return (
    <LibraryView
      repository={repository}
      revision={libraryRevision}
      onCreate={createEssay}
      onOpen={openEssay}
      onDelete={deleteEssay}
    />
  );
}
