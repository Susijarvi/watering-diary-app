import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { getUser } from '../shared/auth';

export async function me(req: HttpRequest): Promise<HttpResponseInit> {
  const user = await getUser(req);
  return {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
    jsonBody: {
      user,
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? null,
    },
  };
}

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: me,
});
