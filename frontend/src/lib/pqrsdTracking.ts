import { randomInt } from 'node:crypto';

export function buildTrackingId(prefix: 'PQR' | 'ANON') {
  const randomSuffix = randomInt(100000, 999999);
  return `${prefix}-${Date.now()}-${randomSuffix}`;
}
