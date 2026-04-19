export function getBackendUrl(): string {
  const value = (process.env.NEXT_PUBLIC_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  if (!value) {
    throw new Error('BACKEND_BASE_URL no esta configurado.');
  }
  return value;
}
