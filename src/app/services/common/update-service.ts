import { Injectable, signal } from '@angular/core';
import { BUILD_VERSION } from '../../../environments/build-info';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const VERSION_PARAM = 'v';

// Detecta despliegues nuevos comparando la versión incrustada en el bundle con
// /version.json (que el servidor no cachea, ver web.config).
@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  readonly updateAvailable = signal(false);

  private latestVersion = BUILD_VERSION;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.removeVersionParam();
    this.checkForUpdate();
    setInterval(() => this.checkForUpdate(), CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
  }

  // Borra la caché del navegador y recarga con una URL nueva, para que el
  // index.html se pida al servidor como en la primera visita. No toca
  // localStorage: conserva la sesión y el menú.
  async applyUpdate(): Promise<void> {
    try {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    } catch {
      // Cache Storage no disponible: la URL nueva ya evita el index.html cacheado.
    }
    const url = new URL(location.href);
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
        this.latestVersion = version;
        this.updateAvailable.set(true);
      }
    } catch {
      // Sin red o respuesta inválida: se reintenta en la siguiente revisión.
    }
  }

  private removeVersionParam(): void {
    const url = new URL(location.href);
    if (!url.searchParams.has(VERSION_PARAM)) return;
    url.searchParams.delete(VERSION_PARAM);
    history.replaceState(history.state, '', url.toString());
  }
}
