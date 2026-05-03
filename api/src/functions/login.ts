import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { verifyGoogleIdToken } from '../shared/google';
import { signSession } from '../shared/jwt';
import { buildSessionCookie, emailToRole, SESSION_TTL_SECONDS } from '../shared/auth';

interface LoginBody {
  credential?: string;
}

export async function login(req: HttpRequest): Promise<HttpResponseInit> {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return { status: 400, jsonBody: { error: 'Invalid JSON' } };
  }
  if (typeof body.credential !== 'string' || body.credential.length < 10) {
    return { status: 400, jsonBody: { error: 'Missing Google credential' } };
  }

  let claims;
  try {
    claims = await verifyGoogleIdToken(body.credential);
  } catch (e) {
    return {
      status: 401,
      jsonBody: { error: 'Invalid Google token', details: e instanceof Error ? e.message : 'unknown' },
    };
  }

  const role = emailToRole(claims.email);
  if (!role) {
    return {
      status: 403,
      jsonBody: { error: 'Tämä Gmail-tunnus ei ole sallittu sovellukseen' },
    };
  }

  const token = await signSession({
    sub: claims.sub,
    email: claims.email,
    role,
  });

  return {
    status: 200,
    headers: {
      'Set-Cookie': buildSessionCookie(token, SESSION_TTL_SECONDS),
    },
    jsonBody: {
      user: {
        userId: claims.sub,
        email: claims.email,
        role,
        name: claims.name,
        picture: claims.picture,
      },
    },
  };
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
