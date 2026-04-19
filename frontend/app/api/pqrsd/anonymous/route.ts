import { NextResponse } from 'next/server';
import { anonymousSchema } from '@/src/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validData = anonymousSchema.parse(body);
    console.log('Received valid anonymous PQRSD:', validData);

    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      message: 'PQRSD radicada exitosamente de forma anonima.',
      trackingId: `ANON-${Math.floor(Math.random() * 90000) + 10000}`,
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
