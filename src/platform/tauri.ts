export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function markShellClasses(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (isTauri()) {
    document.documentElement.classList.add('tauri');
  }
}
