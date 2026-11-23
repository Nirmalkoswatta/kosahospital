import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Role } from '../core/models';
import { Store } from '../core/store';
import { InitialsPipe } from '../shared/format';

type Nav = { path: string; label: string; icon: string; exact?: boolean };

const NAV: Record<Role, Nav[]> = {
  patient: [
    { path: '/app', label: 'Overview', icon: 'space_dashboard', exact: true },
    { path: '/app/book', label: 'Book visit', icon: 'calendar_add_on' },
    { path: '/app/appointments', label: 'Appointments', icon: 'event' },
    { path: '/app/records', label: 'My records', icon: 'clinical_notes' },
    { path: '/app/billing', label: 'Bills', icon: 'receipt_long' },
  ],
  doctor: [
    { path: '/app', label: 'Today', icon: 'space_dashboard', exact: true },
    { path: '/app/appointments', label: 'Appointments', icon: 'event' },
    { path: '/app/patients', label: 'My patients', icon: 'groups' },
    { path: '/app/schedule', label: 'Schedule', icon: 'schedule' },
  ],
  staff: [
    { path: '/app', label: 'Front desk', icon: 'space_dashboard', exact: true },
    { path: '/app/book', label: 'Book for patient', icon: 'calendar_add_on' },
    { path: '/app/appointments', label: 'Appointments', icon: 'event' },
    { path: '/app/patients', label: 'Patients', icon: 'groups' },
    { path: '/app/billing', label: 'Billing', icon: 'receipt_long' },
  ],
  admin: [
    { path: '/app', label: 'Overview', icon: 'space_dashboard', exact: true },
    { path: '/app/people/doctors', label: 'Doctors', icon: 'stethoscope' },
    { path: '/app/people/staff', label: 'Staff', icon: 'badge' },
    { path: '/app/patients', label: 'Patients', icon: 'groups' },
    { path: '/app/departments', label: 'Departments', icon: 'domain' },
    { path: '/app/appointments', label: 'Appointments', icon: 'event' },
    { path: '/app/billing', label: 'Billing', icon: 'receipt_long' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { patient: 'Patient', doctor: 'Doctor', staff: 'Staff', admin: 'Administrator' };

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, InitialsPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  store = inject(Store);
  private router = inject(Router);
  me = computed(() => this.store.me()!);
  nav = computed(() => NAV[this.me().role]);
  roleLabel = computed(() => ROLE_LABEL[this.me().role]);
  greet = computed(() => (this.me().role === 'doctor' ? this.me().name : this.me().name.split(' ')[0]));
  open = signal(false);
  today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => e instanceof NavigationEnd && this.open.set(false));
  }

  // leave the shell first: its template reads me() and would break once the session is gone
  async logout() {
    await this.router.navigateByUrl('/');
    this.store.logout();
    this.router.navigateByUrl('/login');
  }
}
