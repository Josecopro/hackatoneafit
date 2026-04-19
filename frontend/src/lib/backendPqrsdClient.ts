type PersistMode = 'normal' | 'anonymous';

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || '').trim().replace(/\/$/, '');
}

export async function submitPqrsdToBackend(params: {
  mode: PersistMode;
  formData: FormData;
}): Promise<{ success: boolean; message: string; trackingId: string }> {
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    throw new Error('BACKEND_BASE_URL no esta configurado para persistir la solicitud.');
  }

  const route = params.mode === 'normal' ? 'normal' : 'anonymous';

  const response = await fetch(`${baseUrl}/api/pqrsd/${route}`, {
    method: 'POST',
    body: params.formData,
    cache: 'no-store',
  });

   const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof responseBody?.detail === 'string' ? responseBody.detail : null;
    throw new Error(detail || 'No fue posible persistir en el backend desacoplado.');
  }

  return responseBody;
}
