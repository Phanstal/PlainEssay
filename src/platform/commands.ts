import { isTauri } from './tauri';

export type AppCommand =
  | 'new-essay'
  | 'save'
  | 'export-markdown'
  | 'export-docx'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'back';

export type EditorCommand = Exclude<AppCommand, 'new-essay'>;

const EDITOR_EVENT = 'plainessay:editor-command';

/**
 * Native menus emit commands from Rust in the packaged app. In the browser
 * (and in Playwright) the same commands come from keyboard shortcuts.
 */
export function subscribeAppCommands(handler: (command: AppCommand) => void): () => void {
  if (isTauri()) {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void import('@tauri-apps/api/event').then(async ({ listen }) => {
      const stop = await listen<string>('plainessay://command', (event) => {
        handler(event.payload as AppCommand);
      });
      if (disposed) {
        stop();
      } else {
        unlisten = stop;
      }
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (!modifier) {
      return;
    }

    if (event.key.toLowerCase() === 'n' && !event.shiftKey) {
      event.preventDefault();
      handler('new-essay');
    } else if (event.key.toLowerCase() === 's' && !event.shiftKey) {
      event.preventDefault();
      handler('save');
    } else if (event.key.toLowerCase() === 'm' && event.shiftKey) {
      event.preventDefault();
      handler('export-markdown');
    } else if (event.key.toLowerCase() === 'd' && event.shiftKey) {
      event.preventDefault();
      handler('export-docx');
    }
  };

  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}

export function sendEditorCommand(command: EditorCommand): void {
  window.dispatchEvent(new CustomEvent<EditorCommand>(EDITOR_EVENT, { detail: command }));
}

export function subscribeEditorCommands(handler: (command: EditorCommand) => void): () => void {
  const listener = (event: Event) => {
    handler((event as CustomEvent<EditorCommand>).detail);
  };
  window.addEventListener(EDITOR_EVENT, listener);
  return () => window.removeEventListener(EDITOR_EVENT, listener);
}
