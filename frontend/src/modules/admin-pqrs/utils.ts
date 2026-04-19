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
  attachments?: Array<{
    name?: string;
    path?: string;
    mimeType?: string;
    size?: number;
    url?: string;
  }>;
};

type SendOfficialResponsePayload = {
  official_response: string;
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
    attachments: [],
  };
}

export async function getPqrsOldestFirst(): Promise<PqrsRecord[]> {
  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}/api/admin/pqrs`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || 'No fue posible consultar el listado de PQRSD.');
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
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(body.detail || 'No fue posible consultar el detalle de la PQRSD.');
  }

  const item = (await response.json()) as AdminPqrsDetail;
  const base = mapListItemToRecord(item);
  const attachments = Array.isArray(item.attachments)
    ? item.attachments
      .filter((file) => file && typeof file.path === 'string' && file.path.trim().length > 0)
      .map((file) => ({
        name: String(file.name || 'archivo'),
        path: String(file.path),
        mimeType: String(file.mimeType || 'application/octet-stream'),
        size: Number(file.size || 0),
        url: typeof file.url === 'string' ? file.url : undefined,
      }))
    : [];

  return {
    ...base,
    description: item.description,
    draftResponse: item.borrador_respuesta || '',
    requiresHumanReview: Boolean(item.requiere_humano),
    reviewReason: item.razon_revision || 'Borrador generado por IA; requiere validacion humana antes de envio.',
    attachments,
  };
}

export async function sendOfficialResponse(id: string, officialResponse: string): Promise<void> {
  const backendUrl = getBackendUrl();
  const payload: SendOfficialResponsePayload = {
    official_response: officialResponse,
  };

  const response = await fetch(`${backendUrl}/api/admin/pqrs/${id}/send-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = 'No fue posible enviar la respuesta oficial.';
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string' && body.detail.trim()) {
        detail = body.detail;
      }
    } catch {
      // Keep default message when response body is not JSON.
    }
    throw new Error(detail);
  }
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
