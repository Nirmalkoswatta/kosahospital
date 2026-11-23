import { Routes } from '@angular/router';
import { allow, guestOnly } from './core/guards';

export const routes: Routes = [
  { path: '', title: 'Kosa Hospital', loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing) },
  { path: 'login', title: 'Sign in · Kosa', canActivate: [guestOnly], loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'register', title: 'Create account · Kosa', canActivate: [guestOnly], loadComponent: () => import('./pages/auth/register').then((m) => m.Register) },
  {
    path: 'app',
    canActivate: [allow()],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', title: 'Dashboard · Kosa', loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'book', title: 'Book appointment · Kosa', canActivate: [allow('patient', 'staff')], loadComponent: () => import('./pages/book/book').then((m) => m.Book) },
      { path: 'appointments', title: 'Appointments · Kosa', loadComponent: () => import('./pages/appointments/appointments').then((m) => m.Appointments) },
      { path: 'consult/:id', title: 'Consultation · Kosa', canActivate: [allow('doctor')], loadComponent: () => import('./pages/consult/consult').then((m) => m.Consult) },
      { path: 'patients', title: 'Patients · Kosa', canActivate: [allow('doctor', 'staff', 'admin')], loadComponent: () => import('./pages/patients/patients').then((m) => m.Patients) },
      { path: 'patients/:id', title: 'Patient · Kosa', canActivate: [allow('doctor', 'staff', 'admin')], loadComponent: () => import('./pages/patients/patient-detail').then((m) => m.PatientDetail) },
      { path: 'records', title: 'My records · Kosa', canActivate: [allow('patient')], loadComponent: () => import('./pages/patients/patient-detail').then((m) => m.PatientDetail) },
      { path: 'billing', title: 'Billing · Kosa', canActivate: [allow('patient', 'staff', 'admin')], loadComponent: () => import('./pages/billing/billing').then((m) => m.Billing) },
      { path: 'people/:kind', title: 'Team · Kosa', canActivate: [allow('admin')], loadComponent: () => import('./pages/people/people').then((m) => m.People) },
      { path: 'departments', title: 'Departments · Kosa', canActivate: [allow('admin')], loadComponent: () => import('./pages/departments/departments').then((m) => m.Departments) },
      { path: 'schedule', title: 'My schedule · Kosa', canActivate: [allow('doctor')], loadComponent: () => import('./pages/schedule/schedule').then((m) => m.Schedule) },
      { path: 'profile', title: 'Profile · Kosa', loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile) },
    ],
  },
  { path: '**', redirectTo: '' },
];
