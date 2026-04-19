import { NextResponse } from 'next/server';
import { normalSchema } from '@/src/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validData = normalSchema.parse(body);
    console.log('Received valid normal PQRSD:', validData);

    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: 'PQRSD radicada exitosamente con identidad verificada.',
      trackingId: `PQR-${Math.floor(Math.random() * 90000) + 10000}`,
    });
  } catch (error: unknown) {
    const errors =
      typeof error === 'object' &&
      error !== null &&
      'errors' in error &&
      Array.isArray((error as { errors?: unknown[] }).errors)
        ? (error as { errors: unknown[] }).errors
        : [{ message: 'Error de validacion' }];

    return NextResponse.json({ success: false, errors }, { status: 400 });
  }
}
