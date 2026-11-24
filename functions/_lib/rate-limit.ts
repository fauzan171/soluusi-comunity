// Rate-limit kasar per-IP in-memory (PRD §10).
// ponytail: state per-isolate Workers — cukup untuk mem-filter spam insidental,
// bukan bot attack. Upgrade ke Durable Object/D1 kalau perlu limit global.
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter(t => now - t < windowMs);
  if (list.length >= limit) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  // GC: buang IP idle > 5 menit supaya Map tidak tumbuh
  if (hits.size > 1000) {
    for (const [key, times] of hits) if (now - times[times.length - 1] > 300_000) hits.delete(key);
  }
  return false;
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'local';
}

// Self-check
console.assert(rateLimited('t', 2, 60_000) === false);
console.assert(rateLimited('t', 2, 60_000) === false);
console.assert(rateLimited('t', 2, 60_000) === true);
console.assert(rateLimited('other', 2, 60_000) === false);
