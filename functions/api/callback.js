// Cloudflare Pages Function: recibe la respuesta de GitHub y entrega el token al panel /admin.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = request.headers.get('Cookie') || '';
  const saved = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/)?.[1];

  let status = 'error';
  let content = { error: 'No se pudo completar el acceso con GitHub.' };

  if (!code || !state || state !== saved) {
    content = { error: 'La sesión de acceso ha caducado. Vuelve a intentarlo.' };
  } else {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'panel-web' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${url.origin}/api/callback`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.access_token) {
      status = 'success';
      content = { token: data.access_token, provider: 'github' };
    } else if (data.error_description) {
      content = { error: data.error_description };
    }
  }

  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Acceso</title><body>
<p>${status === 'success' ? 'Acceso correcto. Puedes cerrar esta ventana.' : 'No se pudo entrar. Cierra esta ventana e inténtalo de nuevo.'}</p>
<script>
(function () {
  var msg = ${JSON.stringify(message)};
  function receive(e) {
    if (e.origin !== ${JSON.stringify(url.origin)}) return;
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener('message', receive, false);
  }
  window.addEventListener('message', receive, false);
  window.opener && window.opener.postMessage('authorizing:github', ${JSON.stringify(url.origin)});
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': 'oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
