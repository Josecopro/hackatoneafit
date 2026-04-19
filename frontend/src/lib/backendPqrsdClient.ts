type PersistMode = 'normal' | 'anonymous';

export class BackendClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'BackendClientError';
  }
}

function getBackendBaseUrl(): string {
  return (process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '')
    .trim()
    .replace(/\/$/, '');
}

type AdminLoginResult = {
  success: boolean;
  adminEmail: string;
  adminName: string;
};

export async function validateAdminLoginWithBackend(params: {
  email: string;
  password: string;
}): Promise<AdminLoginResult> {
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    throw new Error('BACKEND_BASE_URL no esta configurado para autenticacion administrativa.');
  }

  const response = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
    }),
    cache: 'no-store',
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof responseBody?.detail === 'string' ? responseBody.detail : null;
    throw new BackendClientError(
      detail || 'No fue posible validar el acceso administrativo en backend.',
      response.status,
    );
  }

  return responseBody;
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
    throw new BackendClientError(
      detail || 'No fue posible persistir en el backend desacoplado.',
      response.status,
    );
  }

  return responseBody;
}
