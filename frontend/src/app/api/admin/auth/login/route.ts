import { NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  getAdminCookieName,
  getAdminSessionTtlSeconds,
  isAdminSessionConfigured,
} from '@/lib/adminAuth';
import { validateAdminLoginWithBackend } from '@/lib/backendPqrsdClient';

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  if (!isAdminSessionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: 'La sesion administrativa no esta configurada en el entorno.',
      },
      { status: 503 },
    );
  }

  let body: LoginBody = {};

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Solicitud invalida.',
      },
      { status: 400 },
    );
  }

  const email = (body.email || '').trim();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        message: 'Correo y contrasena son obligatorios.',
      },
      { status: 400 },
    );
  }

  try {
    await validateAdminLoginWithBackend({ email, password });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No fue posible validar credenciales.';
    const status = message === 'Credenciales invalidas.' ? 401 : 503;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status },
    );
  }

  const token = await createAdminSessionToken(email);
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: getAdminCookieName(),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getAdminSessionTtlSeconds(),
  });

  return response;
}