import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Home } from './pages/home/home';
import { Layout } from './layouts/layout/layout';
import { NotFound } from './pages/not-found/not-found';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ConfirmPassword } from './pages/auth/confirm-password/confirm-password';
import { authGuard } from './guards/auth-guard';
import { accessGuard } from './guards/access-guard';
import { NotAuthorized } from './pages/not-authorized/not-authorized';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'confirm-password', component: ConfirmPassword },
  { path: 'not-authorized', component: NotAuthorized },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', component: Home, pathMatch: 'full' },
      {
        path: 'admin',
        children: [
          { path: 'roles', component: Home, canActivate:[accessGuard], data:{ optionId: 5 } },
          { path: 'users', component: Home, canActivate:[accessGuard], data:{ optionId: 5 } }
        ],       
      },
    ],
  },
  { path: '**', component: NotFound },
];
