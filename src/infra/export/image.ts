export type DocxImageType = 'jpg' | 'png' | 'gif';

export interface DataUrlImage {
  bytes: Uint8Array;
  mime: string;
  type: DocxImageType | null;
  width: number;
  height: number;
}

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,([A-Za-z0-9+/=\s]+)$/i;

const MIME_TO_DOCX: Record<string, DocxImageType | null> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': null,
};

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) >>> 0) +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function dimensionsFor(bytes: Uint8Array, mime: string): { width: number; height: number } {
  if (mime === 'image/png' && bytes.length >= 24) {
    const width = readUint32BE(bytes, 16);
    const height = readUint32BE(bytes, 20);
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  if (mime === 'image/gif' && bytes.length >= 10) {
    const width = bytes[6] | (bytes[7] << 8);
    const height = bytes[8] | (bytes[9] << 8);
    if (width > 0 && height > 0) {
      return { width, height };
    }
  }

  if ((mime === 'image/jpeg' || mime === 'image/jpg') && bytes.length >= 4) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = readUint16BE(bytes, offset + 2);
      const isStartOfFrame =
        marker >= 0xc0 && marker <= 0xc3 && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame && offset + 9 < bytes.length) {
        const height = readUint16BE(bytes, offset + 5);
        const width = readUint16BE(bytes, offset + 7);
        if (width > 0 && height > 0) {
          return { width, height };
        }
      }
      offset += 2 + length;
    }
  }

  return { width: 600, height: 400 };
}

export function parseImageDataUrl(src: string): DataUrlImage | null {
  const match = DATA_URL_PATTERN.exec(src.trim());
  if (!match) {
    return null;
  }

  try {
    const binary = atob(match[2].replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const mime = match[1].toLowerCase();
    return {
      bytes,
      mime,
      type: MIME_TO_DOCX[mime] ?? null,
      ...dimensionsFor(bytes, mime),
    };
  } catch {
    return null;
  }
}

export function fitImageWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
