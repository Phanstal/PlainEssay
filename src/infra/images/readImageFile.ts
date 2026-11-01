export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

export interface LocalImage {
  src: string;
  alt: string;
}

export function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) {
    return [];
  }
  return Array.from(data.files).filter((file) => file.type.startsWith('image/'));
}

/**
 * Images stay inside the local essay: the data URL is part of the saved HTML,
 * so there is no upload service and no network dependency.
 */
export function readImageFile(file: File): Promise<LocalImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return Promise.reject(
      new Error('Use a PNG, JPEG, GIF, or WebP image. SVG and other formats are not supported.'),
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error('Images must be smaller than 12 MB.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This image could not be read.'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src.startsWith('data:image/')) {
        reject(new Error('This image could not be read.'));
        return;
      }
      resolve({ src, alt: file.name || 'Image' });
    };
    reader.readAsDataURL(file);
  });
}
