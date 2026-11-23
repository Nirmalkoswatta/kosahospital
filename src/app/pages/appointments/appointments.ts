import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppointmentStatus } from '../../core/models';
import { Store } from '../../core/store';
import { isoDate } from '../../core/scheduling';
import { ApptList } from '../../shared/appt-list';

type Tab = 'upcoming' | 'today' | 'past' | 'all';

@Component({
  selector: 'app-appointments',
  imports: [FormsModule, RouterLink, ApptList],
  template: `
    <div class="page-head">
      <div>
        <h1>Appointments</h1>
        <p>{{ subtitle() }}</p>
      </div>
      @if (canBook()) {
        <a class="btn" routerLink="/app/book"><span class="mi" aria-hidden="true">calendar_add_on</span>New booking</a>
      }
    </div>
    <div class="card">
      <div class="row filters">
        <div class="tabs" role="group" aria-label="When">
          @for (t of tabs; track t.id) {
            <button type="button" [attr.aria-pressed]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
          }
        </div>
        <label class="field grow">
          <span class="sr-only">Status</span>
          <select class="input" [ngModel]="status()" (ngModelChange)="status.set($event)">
            <option value="">Any status</option>
            @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </label>
        @if (me().role !== 'patient') {
          <label class="field grow">
            <span class="sr-only">Search</span>
            <input class="input" type="search" placeholder="Search patient or doctor" [ngModel]="q()" (ngModelChange)="q.set($event)" />
          </label>
        }
      </div>
      <p class="small muted count">{{ items().length }} appointment{{ items().length === 1 ? '' : 's' }}</p>
      <app-appt-list [items]="items()" empty="No appointments match these filters." />
    </div>
  `,
  styles: `.filters { margin-bottom: 0.75rem; } .filters .field { min-width: 180px; } .count { margin: 0 0 0.5rem; }`,
})
export class Appointments {
  store = inject(Store);
  me = computed(() => this.store.me()!);
  today = isoDate(new Date());
  tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'today', label: 'Today' },
    { id: 'past', label: 'Past' },
    { id: 'all', label: 'All' },
  ];
  statuses: AppointmentStatus[] = ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled', 'rejected'];
  tab = signal<Tab>('upcoming');
  status = signal<AppointmentStatus | ''>('');
  q = signal('');
  canBook = computed(() => ['patient', 'staff'].includes(this.me().role));
  subtitle = computed(() =>
    ({ patient: 'Your visits, past and upcoming.', doctor: 'Requests and visits booked with you.', staff: 'Every booking across all clinics.', admin: 'Every booking across all clinics.' })[this.me().role],
  );

  items = computed(() => {
    const me = this.me();
    const q = this.q().trim().toLowerCase();
    const tab = this.tab();
    return this.store
      .appointments()
      .filter((a) => (me.role === 'patient' ? a.patientId === me.id : me.role === 'doctor' ? a.doctorId === me.id : true))
      .filter((a) => (tab === 'upcoming' ? a.date >= this.today : tab === 'today' ? a.date === this.today : tab === 'past' ? a.date < this.today : true))
      .filter((a) => !this.status() || a.status === this.status())
      .filter((a) => !q || `${this.store.user(a.patientId)?.name} ${this.store.user(a.doctorId)?.name}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const k = (a.date + a.time).localeCompare(b.date + b.time);
        return tab === 'past' || tab === 'all' ? -k : k;
      });
  });
}
