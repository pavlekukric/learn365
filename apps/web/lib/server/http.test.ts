import { describe, expect, it } from 'vitest';

import { PayloadTooLargeError, readJsonBody } from './http';

/** A chunked body (no `Content-Length`) that counts how many chunks were pulled. */
function chunkedRequest(chunk: string, chunks: number): { request: Request; pulled: () => number } {
  const bytes = new TextEncoder().encode(chunk);
  let pulled = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled === chunks) {
        controller.close();
        return;
      }
      pulled += 1;
      controller.enqueue(bytes);
    },
  });
  const init: RequestInit & { duplex: 'half' } = { method: 'POST', body, duplex: 'half' };
  return {
    request: new Request('https://istorija365.test/api/me/progress', init),
    pulled: () => pulled,
  };
}

describe('readJsonBody', () => {
  it('reads a chunked JSON body under the cap', async () => {
    const { request } = chunkedRequest('{"a":1}', 1);
    expect(request.headers.get('content-length')).toBeNull();
    await expect(readJsonBody(request)).resolves.toEqual({ a: 1 });
  });

  it('is undefined for an empty body', async () => {
    const request = new Request('https://istorija365.test/api/me/progress', { method: 'POST' });
    await expect(readJsonBody(request)).resolves.toBeUndefined();
  });

  it('refuses a declared Content-Length above the cap before reading', async () => {
    const request = new Request('https://istorija365.test/api/me/progress', {
      method: 'POST',
      headers: { 'content-length': '70000' },
      body: '{}',
    });
    await expect(readJsonBody(request)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it('stops reading a chunked body as soon as it passes the cap (review 2026-10-03 P2 item 15)', async () => {
    // 1 KB chunks, 10 000 of them on offer: a 4 KB cap must stop after 5.
    const { request, pulled } = chunkedRequest('x'.repeat(1024), 10_000);
    await expect(readJsonBody(request, 4 * 1024)).rejects.toBeInstanceOf(PayloadTooLargeError);
    expect(pulled()).toBeLessThanOrEqual(6);
  });
});
