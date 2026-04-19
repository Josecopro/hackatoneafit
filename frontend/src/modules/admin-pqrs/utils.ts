import { getBackendUrl } from '@/lib/backendUrl';
import type { PqrsRecord } from './types';

type AdminPqrsListItem = {
  id: string;
  ticket: string;
  citizen_name: string;
  subject: string;
  directed_to: string;
  status: string;
  created_at: string;
  business_days_elapsed: number;
  business_days_limit: number;
  sentimiento_score: number;
};

type AdminPqrsDetail = AdminPqrsListItem & {
  description: string;
  borrador_respuesta: string;
  requiere_humano: boolean;
  razon_revision: string;
};

function mapStatus(status: string): PqrsRecord['status'] {
  if (status === 'Radicada') return 'Radicada';
  if (status === 'Respondida') return 'Respondida';
  return 'En revision';
}

function mapPriority(businessDaysElapsed: number, businessDaysLimit: number): PqrsRecord['priority'] {
  if (businessDaysElapsed >= businessDaysLimit) return 'Alta';
  if (businessDaysElapsed >= Math.ceil(businessDaysLimit / 2)) return 'Media';
  return 'Baja';
}

function mapListItemToRecord(item: AdminPqrsListItem): PqrsRecord {
  return {
    id: item.id,
    ticket: item.ticket,
    citizenName: item.citizen_name,
    subject: item.subject,
    description: '',
    draftResponse: '',
    requiresHumanReview: true,
    reviewReason: 'Borrador generado por IA; requiere validacion humana antes de envio.',
    directedTo: item.directed_to,
    status: mapStatus(item.status),
    priority: mapPriority(item.business_days_elapsed, item.business_days_limit),
    createdAt: item.created_at,
    businessDaysElapsed: item.business_days_elapsed,
    businessDaysLimit: item.business_days_limit,
    sentimentScore: item.sentimiento_score,
  };
}

export async function getPqrsOldestFirst(): Promise<PqrsRecord[]> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/admin/pqrs`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('No fue posible consultar el listado de PQRSD.');
  }

  const items = (await response.json()) as AdminPqrsListItem[];
  return items.map(mapListItemToRecord);
}

export async function getPqrsById(id: string): Promise<PqrsRecord | null> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/admin/pqrs/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('No fue posible consultar el detalle de la PQRSD.');
  }

  const item = (await response.json()) as AdminPqrsDetail;
  const base = mapListItemToRecord(item);
  return {
    ...base,
    description: item.description,
    draftResponse: item.borrador_respuesta || '',
    requiresHumanReview: Boolean(item.requiere_humano),
    reviewReason: item.razon_revision || 'Borrador generado por IA; requiere validacion humana antes de envio.',
  };
}

export function formatDate(dateISO: string): string {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha invalida';
  }

  const pad = (value: number): string => String(value).padStart(2, '0');
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = String(date.getUTCFullYear());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes} UTC`;
}
