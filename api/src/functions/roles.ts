import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';

interface RolesRequestBody {
  identityProvider?: string;
  userId?: string;
  userDetails?: string;
  claims?: Array<{ typ: string; val: string }>;
  accessToken?: string;
}

/**
 * SWA roles function. Receives identity claims after auth and returns roles.
 * - ADMIN_EMAIL  → ["admin"]
 * - CHILD_EMAIL  → ["user"]
 * - everyone else → []  (effectively denied via staticwebapp.config.json)
 */
export async function roles(req: HttpRequest): Promise<HttpResponseInit> {
  let body: RolesRequestBody = {};
  try {
    body = (await req.json()) as RolesRequestBody;
  } catch {
    /* roles function may receive empty body during local testing */
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const childEmail = (process.env.CHILD_EMAIL ?? '').toLowerCase().trim();

  const email = (
    body.userDetails ??
    body.claims?.find((c) => c.typ === 'email')?.val ??
    ''
  ).toLowerCase().trim();

  const out: string[] = [];
  if (email && email === adminEmail) out.push('admin');
  else if (email && email === childEmail) out.push('user');

  return {
    status: 200,
    jsonBody: { roles: out },
  };
}

app.http('roles', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/roles',
  handler: roles,
});
