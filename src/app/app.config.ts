import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { routes } from './app.routes';
import { resolveApiBaseUrl } from './services/core/api-base-url-initializer';
import { AuthService } from './services/auth/auth-service';
import { ClientErrorHandler } from './services/system-monitoring/client-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: ClientErrorHandler },
    // After the first navigation, download the user's own (menu-based) lazy pages in the
    // background so opening them later has no loading delay.
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAppInitializer(async () => {
      // Inject first (before any await); the base URL must be resolved before the first request.
      const auth = inject(AuthService);
      await resolveApiBaseUrl();
      await auth.restoreSession();
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
  ],
};
