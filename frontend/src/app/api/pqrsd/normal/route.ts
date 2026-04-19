import { NextResponse } from 'next/server';
import { submitPqrsdToBackend } from '@/lib/backendPqrsdClient';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const result = await submitPqrsdToBackend({
      mode: 'normal',
      formData,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errors = [{ message: error instanceof Error ? error.message : 'Error de validacion' }];

    return NextResponse.json({ success: false, errors }, { status: 400 });
  }
}
