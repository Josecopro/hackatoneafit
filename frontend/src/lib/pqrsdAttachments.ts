import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'pqrsd-attachments';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

export type StoredAttachment = {
  bucket: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
};

export function normalizeIncomingFiles(entries: FormDataEntryValue[]): File[] {
  return entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function assertValidAttachments(files: File[]): void {
  if (files.length > MAX_FILES) {
    throw new Error(`Solo se permiten hasta ${MAX_FILES} archivos adjuntos.`);
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`El archivo ${file.name} supera el limite de 10 MB.`);
    }
  }
}

export async function uploadAttachments(params: {
  supabase: SupabaseClient;
  requestType: 'normal' | 'anonymous';
  trackingId: string;
  files: File[];
}): Promise<StoredAttachment[]> {
  const { supabase, requestType, trackingId, files } = params;
  const uploaded: StoredAttachment[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const extension = getFileExtension(file.name);
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
    const fileName = `${String(index + 1).padStart(2, '0')}-${baseName}${extension}`;
    const path = `${requestType}/${trackingId}/${fileName}`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      await cleanupUploadedAttachments(supabase, uploaded);
      throw new Error(`No fue posible subir el archivo ${file.name}.`);
    }

    uploaded.push({
      bucket: BUCKET_NAME,
      path,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
    });
  }

  return uploaded;
}

export async function cleanupUploadedAttachments(
  supabase: SupabaseClient,
  attachments: StoredAttachment[],
): Promise<void> {
  if (!attachments.length) {
    return;
  }

  const paths = attachments.map((attachment) => attachment.path);
  await supabase.storage.from(BUCKET_NAME).remove(paths);
}

function sanitizeFileName(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'archivo';
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return '';
  }

  const extension = fileName.slice(dotIndex).toLowerCase();
  return extension.length > 10 ? '' : extension;
}
