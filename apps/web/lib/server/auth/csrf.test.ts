import { describe, expect, it } from 'vitest';

import { isSameOriginRequest } from './csrf';

const APP = 'https://istorija365.com';

function request(headers: Record<string, string>): Request {
  return new Request(`${APP}/api/me`, { method: 'POST', headers });
}

describe('isSameOriginRequest', () => {
  it('accepts the exact public origin', () => {
    expect(isSameOriginRequest(request({ origin: APP }), APP)).toBe(true);
  });

  it('refuses any other origin, including www and http', () => {
    expect(isSameOriginRequest(request({ origin: 'https://www.istorija365.com' }), APP)).toBe(
      false,
    );
    expect(isSameOriginRequest(request({ origin: 'http://istorija365.com' }), APP)).toBe(false);
    expect(isSameOriginRequest(request({ origin: 'null' }), APP)).toBe(false);
  });

  it('without Origin, trusts only a same-origin fetch metadata header', () => {
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'same-origin' }), APP)).toBe(true);
    expect(isSameOriginRequest(request({ 'sec-fetch-site': 'cross-site' }), APP)).toBe(false);
    expect(isSameOriginRequest(request({}), APP)).toBe(false);
  });
});
