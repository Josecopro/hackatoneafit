const ADMIN_COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  sub: 'admin';
  email: string;
  iat: number;
  exp: number;
};

function base64UrlEncode(raw: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(raw, 'utf8').toString('base64url');
  }

  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(encoded: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  }

  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

async function hmacSha256(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const bytes = new Uint8Array(signature);

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function secureCompare(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE_NAME;
}

export function getAdminSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export function isAdminSessionConfigured(): boolean {
  const adminSecret = (process.env.ADMIN_AUTH_SECRET || '').trim();

  return Boolean(adminSecret);
}

export async function createAdminSessionToken(email: string): Promise<string> {
  const secret = (process.env.ADMIN_AUTH_SECRET || '').trim();
  if (!secret) {
    throw new Error('ADMIN_AUTH_SECRET no esta configurado.');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: 'admin',
    email: email.trim().toLowerCase(),
    iat: nowSeconds,
    exp: nowSeconds + SESSION_TTL_SECONDS,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacSha256(payloadEncoded, secret);

  return `${payloadEncoded}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<SessionPayload | null> {
  const secret = (process.env.ADMIN_AUTH_SECRET || '').trim();
  if (!secret || !token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = await hmacSha256(payloadEncoded, secret);

  if (!secureCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payloadRaw = base64UrlDecode(payloadEncoded);
    const payload = JSON.parse(payloadRaw) as SessionPayload;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (payload.sub !== 'admin') {
      return null;
    }

    if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}