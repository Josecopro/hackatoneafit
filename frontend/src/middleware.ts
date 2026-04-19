import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAdminCookieName, verifyAdminSessionToken } from '@/lib/adminAuth';

const LOGIN_PATH = '/administracion/login';
const ADMIN_HOME_PATH = '/administracion/pqrs';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(getAdminCookieName())?.value || '';
  const session = await verifyAdminSessionToken(token);

  if (pathname === LOGIN_PATH && session) {
    return NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url));
  }

  if (pathname !== LOGIN_PATH && !session) {
    const target = `${pathname}${search}`;
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('next', target);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/administracion/:path*'],
};