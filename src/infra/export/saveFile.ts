import { isTauri } from '../../platform/tauri';

export interface SaveFilter {
  name: string;
  extensions: string[];
}

export interface SaveFileOptions {
  defaultName: string;
  data: Uint8Array | string;
  mimeType: string;
  filters: SaveFilter[];
}

export type SaveResult = 'saved' | 'cancelled';

function toBytes(data: Uint8Array | string): Uint8Array {
  return typeof data === 'string' ? new TextEncoder().encode(data) : data;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    let partial = '';
    for (let index = 0; index < chunk.length; index += 1) {
      partial += String.fromCharCode(chunk[index]);
    }
    binary += partial;
  }
  return btoa(binary);
}

export async function saveFile(options: SaveFileOptions): Promise<SaveResult> {
  const bytes = toBytes(options.data);

  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const path = await save({
      defaultPath: options.defaultName,
      filters: options.filters,
    });
    if (!path) {
      return 'cancelled';
    }

    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_export', { path, dataBase64: toBase64(bytes) });
    return 'saved';
  }

  const blob = new Blob([bytes as unknown as BlobPart], { type: options.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.defaultName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return 'saved';
}
