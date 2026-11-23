import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { freeSlots, isoDate } from '../../core/scheduling';
import { InitialsPipe, LkrPipe } from '../../shared/format';
import { Tilt } from '../../shared/tilt';

@Component({
  selector: 'app-book',
  imports: [FormsModule, InitialsPipe, LkrPipe, Tilt],
  templateUrl: './book.html',
  styleUrl: './book.scss',
})
export class Book {
  store = inject(Store);
  private ns = inject(NotificationService);
  private router = inject(Router);

  isStaff = computed(() => this.store.me()?.role === 'staff');
  steps = computed(() => (this.isStaff() ? ['Patient', 'Department', 'Doctor', 'Time', 'Confirm'] : ['Department', 'Doctor', 'Time', 'Confirm']));
  step = signal(0);
  stepName = computed(() => this.steps()[this.step()]);

  patientQuery = signal('');
  patientId = signal(this.isStaff() ? '' : this.store.me()!.id);
  deptId = signal('');
  doctorId = signal('');
  date = signal('');
  time = signal('');
  reason = '';

  patientMatches = computed(() => {
    const q = this.patientQuery().trim().toLowerCase();
    return this.store.patients().filter((p) => p.active && (!q || `${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(q))).slice(0, 8);
  });
  doctorsInDept = computed(() => this.store.doctors().filter((d) => d.active && d.departmentId === this.deptId()));
  doctor = computed(() => this.store.user(this.doctorId()));
  days = computed(() => {
    const doc = this.doctor();
    if (!doc) return [];
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() + i * 86400000);
      const iso = isoDate(d);
      return {
        iso,
        wd: d.toLocaleDateString('en', { weekday: 'short' }),
        day: d.getDate(),
        free: freeSlots(doc, iso, this.store.appointments()).length,
      };
    });
  });
  slots = computed(() => {
    const doc = this.doctor();
    return doc && this.date() ? freeSlots(doc, this.date(), this.store.appointments()) : [];
  });

  canNext = computed(() => {
    switch (this.stepName()) {
      case 'Patient': return !!this.patientId();
      case 'Department': return !!this.deptId();
      case 'Doctor': return !!this.doctorId();
      case 'Time': return !!this.date() && this.slots().includes(this.time());
      default: return true;
    }
  });

  pickDept(id: string) { this.deptId.set(id); this.doctorId.set(''); this.date.set(''); this.time.set(''); this.next(); }
  pickDoctor(id: string) {
    this.doctorId.set(id);
    this.time.set('');
    this.date.set(this.days().find((d) => d.free > 0)?.iso ?? '');
    this.next();
  }
  pickDate(iso: string) { this.date.set(iso); this.time.set(''); }

  next() { if (this.step() < this.steps().length - 1) this.step.update((s) => s + 1); }
  back() { if (this.step() > 0) this.step.update((s) => s - 1); }

  confirm() {
    if (!this.reason.trim()) return this.ns.warn('Tell the doctor briefly why you are coming in.');
    const ok = this.ns.attempt(
      () => this.store.book({ patientId: this.patientId(), doctorId: this.doctorId(), date: this.date(), time: this.time(), reason: this.reason.trim() }),
      'Appointment requested — the doctor will confirm it.',
    );
    if (ok) this.router.navigateByUrl('/app/appointments');
    else this.step.set(this.steps().indexOf('Time')); // slot got taken: back to times
  }

  longDate = (d: string) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '');
}
