import { NextResponse } from 'next/server';

import { BackendClientError, submitPqrsdToBackend } from '@/lib/backendPqrsdClient';

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: [{ message: 'Solicitud invalida.' }],
      },
      { status: 400 },
    );
  }

  try {
    const result = await submitPqrsdToBackend({
      mode: 'anonymous',
      formData,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No fue posible radicar la solicitud.';
    const status = error instanceof BackendClientError ? error.status : 503;

    return NextResponse.json(
      {
        success: false,
        errors: [{ message }],
      },
      { status },
    );
  }
}
