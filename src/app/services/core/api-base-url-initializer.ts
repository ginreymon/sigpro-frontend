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

/**
 * App initializer: probes every URL in `environment.API_URLS` in parallel and sets
 * `environment.BASE_API_URL` to the first one that answers. Services read the value
 * after initializers finish, so they need no changes. If none answers, the default
 * `BASE_API_URL` is kept and the usual request error surfaces.
 */
export const resolveApiBaseUrl = async (): Promise<void> => {
  const candidates = environment.API_URLS;
  if (candidates.length < 2) return;

  try {
    environment.BASE_API_URL = await Promise.any(candidates.map(probe));
  } catch {
    // No candidate reachable: keep the default BASE_API_URL.
  }
};
