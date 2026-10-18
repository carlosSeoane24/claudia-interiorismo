// Cloudflare Pages Function: inicia el acceso con GitHub para el panel /admin.
// Necesita las variables GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en Cloudflare.
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return new Response('Falta configurar GITHUB_CLIENT_ID en Cloudflare Pages.', { status: 500 });
  }
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', `${url.origin}/api/callback`);
  authorize.searchParams.set('scope', 'repo,user');
  authorize.searchParams.set('state', state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
