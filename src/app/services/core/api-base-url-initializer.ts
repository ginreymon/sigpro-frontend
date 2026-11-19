import { environment } from '../../../environments/environment';

const PROBE_TIMEOUT_MS = 3000;

// `no-cors` is enough: any response (even an opaque one) proves the host is reachable,
// and it avoids failing the probe when CORS is not configured for the probe path.
const probe = async (baseUrl: string): Promise<string> => {
  await fetch(`${baseUrl}/auth/login/`, {
    mode: 'no-cors',
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  return baseUrl;
};

const STORED_URL_KEY = 'api_base_url';

/** Non-secret flag ("1") telling the app that a refresh cookie probably exists. Never a token. */
export const SESSION_HINT_KEY = 'session_active';

/**
 * Remembers the API host in use. The HttpOnly refresh cookie is scoped to the host that
 * issued it, so after a reload the same host must be used or the cookie is not sent.
 * Holds only a public URL, never a token.
 */
export const persistApiBaseUrl = (): void => {
  try {
    localStorage.setItem(STORED_URL_KEY, environment.BASE_API_URL);
  } catch {
    // Storage unavailable: fall back to probing on the next load.
  }
};

/**
 * App initializer: sets `environment.BASE_API_URL`. The host used by the previous session is
 * reused while it still answers (it holds the refresh cookie); otherwise every URL in
 * `environment.API_URLS` is probed in parallel and the first to answer wins. Services read the
 * value after initializers finish. If none answers, the default is kept and the usual request
 * error surfaces.
 */
export const resolveApiBaseUrl = async (): Promise<void> => {
  const candidates = environment.API_URLS;
  if (candidates.length < 2) return;

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORED_URL_KEY);
  } catch {
    // Storage unavailable: probe all candidates.
  }

  // Preferred host, in order: the API on the same host as this page (same-site, so the
  // SameSite=Lax refresh cookie is sent and the csrftoken cookie is readable), then the
  // host of the previous session.
  const sameHost = candidates.find((url) => new URL(url).hostname === location.hostname);
  const preferred = [sameHost, stored].filter(
    (url): url is string => !!url && candidates.includes(url),
  );

  // With an active session the refresh cookie lives on the preferred host: never switch away
  // from it because a probe was slow, or the next refresh would be sent without the cookie.
  let hasSession = false;
  try {
    hasSession = !!localStorage.getItem(SESSION_HINT_KEY);
  } catch {
    // Storage unavailable: treat as no session.
  }
  if (hasSession && preferred.length) {
    environment.BASE_API_URL = preferred[0];
    return;
  }

  for (const url of preferred) {
    try {
      environment.BASE_API_URL = await probe(url);
      return;
    } catch {
      // Unreachable: try the next preference, then probe all candidates.
    }
  }

  try {
    environment.BASE_API_URL = await Promise.any(candidates.map(probe));
  } catch {
    // No candidate reachable: keep the default BASE_API_URL.
  }
};
