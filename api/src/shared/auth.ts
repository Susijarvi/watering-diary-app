import type { HttpRequest } from '@azure/functions';

export interface ClientPrincipal {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
  claims?: Array<{ typ: string; val: string }>;
}

/**
 * Reads the Static Web Apps client principal from the x-ms-client-principal header.
 * Returns null when no authenticated user is present.
 */
export function getClientPrincipal(req: HttpRequest): ClientPrincipal | null {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

export function isAdmin(principal: ClientPrincipal | null): boolean {
  return principal?.userRoles?.includes('admin') ?? false;
}
