import { app, type HttpResponseInit } from '@azure/functions';
import { clearSessionCookie } from '../shared/auth';

export async function logout(): Promise<HttpResponseInit> {
  return {
    status: 200,
    headers: { 'Set-Cookie': clearSessionCookie() },
    jsonBody: { ok: true },
  };
}

app.http('logout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/logout',
  handler: logout,
});
