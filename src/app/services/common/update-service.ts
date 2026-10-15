import { Injectable, signal } from '@angular/core';
import { BUILD_VERSION } from '../../../environments/build-info';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_PARAM = 'v';

// Detects new deployments by comparing the version embedded in the bundle with
// /version.json (which the server does not cache, see web.config).
@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  readonly updateAvailable = signal(false);

  private latestVersion = BUILD_VERSION;
  private started = false;
  // Version we already reloaded for (comes in ?v=). If the bundle is still the old
  // one after reloading, do not warn again about that same version: avoids a loop.
  private reloadedFor: string | null = null;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.reloadedFor = this.removeVersionParam();
    this.checkForUpdate();
    setInterval(() => this.checkForUpdate(), CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
  }

  // Clears the browser cache and reloads with a new URL so index.html is requested
  // from the server as on the first visit. Leaves localStorage untouched: keeps the
  // session and the menu. With toHome it reloads at the app root instead of the
  // current route (for the fixed /update view).
  async applyUpdate(toHome = false): Promise<void> {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      const registrations = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
    } catch {
      // Cache Storage unavailable: the new URL already avoids the cached index.html.
    }
    try {
      // Refreshes index.html in the HTTP cache so it points to the new bundle.
      await fetch(document.baseURI, { cache: 'reload' });
    } catch {
      // No network: reload anyway.
    }
    const url = toHome ? new URL(document.baseURI) : new URL(location.href);
    url.searchParams.set(VERSION_PARAM, this.latestVersion);
    location.replace(url.toString());
  }

  private async checkForUpdate(): Promise<void> {
    if (this.updateAvailable()) return;
    try {
      const response = await fetch(new URL('version.json', document.baseURI), { cache: 'no-store' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (version && version !== BUILD_VERSION) {
        if (version === this.reloadedFor) {
          console.warn(
            `Reloaded for version ${version} but the bundle is still ${BUILD_VERSION}: ` +
              'cached index.html or version.json from a different build.',
          );
          return;
        }
        this.latestVersion = version;
        this.updateAvailable.set(true);
      }
    } catch {
      // No network or invalid response: retried on the next check.
    }
  }

  private removeVersionParam(): string | null {
    const url = new URL(location.href);
    const value = url.searchParams.get(VERSION_PARAM);
    if (value === null) return null;
    url.searchParams.delete(VERSION_PARAM);
    history.replaceState(history.state, '', url.toString());
    return value;
  }
}
