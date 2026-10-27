export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac/i.test(navigator.userAgent);
}

export function markShellClasses(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (isTauri()) {
    document.documentElement.classList.add('tauri');
    if (isMacOS()) {
      document.documentElement.classList.add('tauri-macos');
    }
  }
}
