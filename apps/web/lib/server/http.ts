import 'server-only';

import { NextResponse } from 'next/server';

/** Small, shared answers for the `/api/**` route handlers. */
export const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export function jsonNoStore<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export function apiNotFound(): NextResponse {
  return jsonNoStore({ error: 'not_found' }, 404);
}

export function apiUnauthorized(): NextResponse {
  return jsonNoStore({ error: 'unauthorized' }, 401);
}

export function apiForbidden(): NextResponse {
  return jsonNoStore({ error: 'forbidden' }, 403);
}

export function apiBadRequest(detail: string): NextResponse {
  return jsonNoStore({ error: 'bad_request', detail }, 400);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}

export class PayloadTooLargeError extends Error {
  constructor() {
    super('payload too large');
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Read a JSON body with a hard byte cap (default 64 KB). Returns
 * `undefined` for an empty body; throws `PayloadTooLargeError` above the
 * cap and `SyntaxError` for malformed JSON — callers map both to 4xx.
 */
export async function readJsonBody(request: Request, maxBytes = 64 * 1024): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new PayloadTooLargeError();
  }
  const text = await request.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw new PayloadTooLargeError();
  }
  if (text.trim().length === 0) return undefined;
  return JSON.parse(text) as unknown;
}
