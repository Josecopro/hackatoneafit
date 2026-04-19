import { NextResponse } from 'next/server';
import { getAdminCookieName } from '@/lib/adminAuth';

function clearSession(response: NextResponse): NextResponse {
  response.cookies.set({
    name: getAdminCookieName(),
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}

export async function GET(request: Request) {
  const nextUrl = new URL('/administracion/login', request.url);
  const response = NextResponse.redirect(nextUrl);
  return clearSession(response);
}

export async function POST() {
  return clearSession(NextResponse.json({ success: true }));
}