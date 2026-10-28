
const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, '');
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(length = 64) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
}

export async function startCognitoAuth(mode: 'login' | 'signup') {
  if (!domain || !clientId) {
    throw new Error('Cognito environment variables are missing.');
  }

  const verifier = randomString(64);
  const state = randomString(32);
  const challenge = await sha256(verifier);

  sessionStorage.setItem('applytrack-pkce-verifier', verifier);
  sessionStorage.setItem('applytrack-oauth-state', state);

  const redirectUri = `${window.location.origin}/login`;
  const url = new URL(`${domain}/${mode === 'signup' ? 'signup' : 'login'}`);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);

  window.location.assign(url.toString());
}

export async function exchangeCognitoCode(code: string, state: string) {
  if (!domain || !clientId) {
    throw new Error('Cognito environment variables are missing.');
  }

  const savedState = sessionStorage.getItem('applytrack-oauth-state');
  const verifier = sessionStorage.getItem('applytrack-pkce-verifier');

  if (!savedState || state !== savedState || !verifier) {
    throw new Error('Sign-in validation failed. Please try again.');
  }

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: `${window.location.origin}/login`,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error('Cognito sign-in failed. Please try again.');
  }

  const result = (await response.json()) as { id_token?: string };

  if (!result.id_token) {
    throw new Error('Cognito did not return an ID token.');
  }

  sessionStorage.removeItem('applytrack-oauth-state');
  sessionStorage.removeItem('applytrack-pkce-verifier');
  sessionStorage.setItem('applytrack-id-token', result.id_token);

  return result.id_token;
}
