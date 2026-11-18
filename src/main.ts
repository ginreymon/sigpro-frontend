import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEsCO);

// Longest the boot loader waits for the first page and the fonts before showing the app anyway.
const BOOT_TIMEOUT_MS = 8000;

// Hide the boot loader only when the app is rendered, its first (lazy) page is loaded and the fonts are ready,
// so the user never sees an empty screen or text that changes font.
function revealApp(): void {
  document.documentElement.classList.add('app-ready');
  document.getElementById('app-boot-loader')?.remove();
}

bootstrapApplication(App, appConfig)
  .then(async (appRef) => {
    const router = appRef.injector.get(Router);
    const firstPage = router.navigated
      ? Promise.resolve()
      : firstValueFrom(
          router.events.pipe(filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError)),
        );
    const fonts = Promise.all([document.fonts.load('400 1em "Hanken Grotesk"'), document.fonts.load('600 1em "Hanken Grotesk"')]);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, BOOT_TIMEOUT_MS));
    await Promise.race([Promise.all([firstPage, fonts]), timeout]);
  })
  .catch((err) => console.error(err))
  .finally(revealApp);
