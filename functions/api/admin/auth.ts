export function authed(request: Request, env: any): boolean {
  const cookie = request.headers.get('Cookie') ?? '';
  const m = cookie.match(/admin_auth=([^;]+)/);
  return !!m && m[1] === (env.ADMIN_PIN ?? '1209');
}

export function onRequestGet({ env, request }: any) {
  return Response.json(
    { authenticated: authed(request, env) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
