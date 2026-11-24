/// <reference types="@cloudflare/workers-types" />

type PagesFunction<C = any> = {
  (ctx: { request: Request; env: C; params: Record<string, string>; context: { waitUntil: (p: Promise<any>) => void } }): Response | Promise<Response>;
};

interface Env {
  DB: D1Database;
  ADMIN_PIN?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: any }>;
}
