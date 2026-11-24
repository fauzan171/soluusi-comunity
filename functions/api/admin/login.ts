import { bad, readJSON } from '../../_lib/api';

// POST /api/admin/login — PIN admin → cookie httpOnly (pattern TVS)
export async function onRequestPost({ env, request }: any) {
  const body = await readJSON<{ pin?: string }>(request);
  const pin = env.ADMIN_PIN ?? '1209';
  if (body.pin !== pin) {
    await new Promise(r => setTimeout(r, 1000));
    return bad('PIN salah', 401);
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': `admin_auth=${pin}; HttpOnly; SameSite=Strict; Max-Age=28800; Path=/${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    },
  });
}
