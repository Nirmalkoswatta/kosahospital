
import { Routes } from '@angular/router';
import { RoleGuard } from './core/role-guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
	{ path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },
	{ path: 'admin', loadComponent: () => import('./admin/dashboard/dashboard').then(m => m.Dashboard), canActivate: [RoleGuard], data: { role: 'admin' } },
	{ path: 'doctor', loadComponent: () => import('./doctor/dashboard/dashboard').then(m => m.Dashboard), canActivate: [RoleGuard], data: { role: 'doctor' } },
	{ path: 'patient', loadComponent: () => import('./patient/dashboard/dashboard').then(m => m.Dashboard), canActivate: [RoleGuard], data: { role: 'patient' } },
	{ path: 'employee', loadComponent: () => import('./employee/dashboard/dashboard').then(m => m.Dashboard), canActivate: [RoleGuard], data: { role: 'employee' } },
];
