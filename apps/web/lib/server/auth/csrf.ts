import 'server-only';

/**
 * Cross-site request forgery guard for mutating routes, on top of the
 * `SameSite=Lax` cookie. Browsers send `Origin` on every non-GET request;
 * it has to be exactly the public origin. Without an `Origin` header the
 * request must at least be marked same-origin by the browser
 * (`Sec-Fetch-Site`). Anything else is refused.
 */
export function isSameOriginRequest(request: Request, appUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (origin !== null) return origin === appUrl;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}
