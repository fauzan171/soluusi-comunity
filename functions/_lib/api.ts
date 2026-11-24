export function bad(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}

export async function readJSON<T = any>(req: Request): Promise<T> {
  try { return await req.json(); } catch { return {} as T; }
}
