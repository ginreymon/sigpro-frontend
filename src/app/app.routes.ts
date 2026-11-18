import { Routes } from '@angular/router';
import { Layout } from './layouts/layout/layout';
import { authGuard } from './guards/auth-guard';
import { getDynamicRoutes } from './routes/get-dynamic-routes';

// Layout stays eager (shell of every private page); every page is loaded on demand.
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login) },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'confirm-password',
    loadComponent: () =>
      import('./pages/auth/confirm-password/confirm-password').then((m) => m.ConfirmPassword),
  },
  {
    path: 'not-authorized',
    loadComponent: () =>
      import('./pages/not-authorized/not-authorized').then((m) => m.NotAuthorized),
  },
  {
    path: 'app-update',
    loadComponent: () =>
      import('./shared/components/notifications/update-available/update-available').then(
        (m) => m.UpdateAvailable,
      ),
    data: { alwaysVisible: true },
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
        pathMatch: 'full',
      },
      ...getDynamicRoutes(),
    ],
  },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
