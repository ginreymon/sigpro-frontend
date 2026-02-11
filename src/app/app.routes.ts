import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/home/home';
import { Layout } from './layouts/layout/layout';
import { NotFound } from './pages/not-found/not-found';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ConfirmPassword } from './pages/auth/confirm-password/confirm-password';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'confirm-password', component: ConfirmPassword },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Home, pathMatch: 'full' },
      {
        path: 'modulos',
        children: [
          { path: 'bonding', component: Home },
          { path: 'inventario', component: Home },
          { path: 'ventas', component: Home },
        ],
      },
    ],
  },
  { path: '**', component: NotFound },
];
