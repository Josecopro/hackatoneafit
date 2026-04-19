import { mockPqrs } from './mockPqrs';
import type { PqrsRecord } from './types';

export function getPqrsOldestFirst(): PqrsRecord[] {
  return [...mockPqrs].sort((a, b) => {
    const left = new Date(a.createdAt).getTime();
    const right = new Date(b.createdAt).getTime();
    return left - right;
  });
}

export function getPqrsById(id: string): PqrsRecord | undefined {
  return mockPqrs.find((record) => record.id === id);
}

export function formatDate(dateISO: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateISO));
}
