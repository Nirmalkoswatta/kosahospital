import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment, invoiceTotal } from '../../core/models';
import { Store } from '../../core/store';
import { isoDate } from '../../core/scheduling';
import { ApptList } from '../../shared/appt-list';
import { InitialsPipe, LkrPipe } from '../../shared/format';
import { Tilt } from '../../shared/tilt';

const byTime = (a: Appointment, b: Appointment) => (a.date + a.time).localeCompare(b.date + b.time);
const live = (a: Appointment) => ['pending', 'confirmed', 'checked-in'].includes(a.status);

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ApptList, Tilt, LkrPipe, InitialsPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  store = inject(Store);
  me = computed(() => this.store.me()!);
  today = isoDate(new Date());

  // ---- patient ----
  myAppts = computed(() => this.store.appointments().filter((a) => a.patientId === this.me().id).sort(byTime));
  upcoming = computed(() => this.myAppts().filter((a) => live(a) && a.date >= this.today));
  next = computed(() => this.upcoming()[0]);
  myRecords = computed(() => this.store.records().filter((r) => r.patientId === this.me().id).sort((a, b) => b.date.localeCompare(a.date)));
  myUnpaid = computed(() => this.store.invoices().filter((i) => i.patientId === this.me().id && i.status === 'unpaid').reduce((s, i) => s + invoiceTotal(i), 0));

  // ---- doctor ----
  docAppts = computed(() => this.store.appointments().filter((a) => a.doctorId === this.me().id).sort(byTime));
  queue = computed(() => this.docAppts().filter((a) => a.date === this.today && ['confirmed', 'checked-in'].includes(a.status)));
  requests = computed(() => this.docAppts().filter((a) => a.status === 'pending' && a.date >= this.today));
  docPatients = computed(() => new Set(this.docAppts().map((a) => a.patientId)).size);
  docDone = computed(() => this.docAppts().filter((a) => a.status === 'completed').length);

  // ---- staff / admin ----
  todayAll = computed(() => this.store.appointments().filter((a) => a.date === this.today && a.status !== 'cancelled' && a.status !== 'rejected').sort(byTime));
  checkedIn = computed(() => this.todayAll().filter((a) => a.status === 'checked-in').length);
  unpaid = computed(() => this.store.invoices().filter((i) => i.status === 'unpaid'));
  unpaidTotal = computed(() => this.unpaid().reduce((s, i) => s + invoiceTotal(i), 0));
  revenue = computed(() => this.store.invoices().filter((i) => i.status === 'paid').reduce((s, i) => s + invoiceTotal(i), 0));

  /** Appointments per day for the next 7 days (admin chart). */
  week = computed(() => {
    const days = Array.from({ length: 7 }, (_, i) => isoDate(new Date(Date.now() + i * 86400000)));
    const rows = days.map((d) => ({
      d,
      label: new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }),
      n: this.store.appointments().filter((a) => a.date === d && live(a)).length,
    }));
    const max = Math.max(1, ...rows.map((r) => r.n));
    return rows.map((r) => ({ ...r, pct: (r.n / max) * 100 }));
  });

  weekLabel = computed(() => 'Appointments per day: ' + this.week().map((w) => `${w.label} ${w.n}`).join(', '));

  /** Share of all appointments per department (admin). */
  deptLoad = computed(() => {
    const all = this.store.appointments();
    const rows = this.store.departments().map((d) => ({
      name: d.name,
      icon: d.icon,
      n: all.filter((a) => this.store.user(a.doctorId)?.departmentId === d.id).length,
    }));
    const max = Math.max(1, ...rows.map((r) => r.n));
    return rows.map((r) => ({ ...r, pct: (r.n / max) * 100 })).sort((a, b) => b.n - a.n);
  });

  newestPatients = computed(() => [...this.store.patients()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));

  longDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
