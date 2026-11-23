import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InvoiceItem, Prescription } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { InitialsPipe, LkrPipe, ageFrom } from '../../shared/format';

@Component({
  selector: 'app-consult',
  imports: [FormsModule, RouterLink, InitialsPipe, LkrPipe],
  templateUrl: './consult.html',
  styles: `
    .layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 1rem; align-items: start; }
    @media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
    .side { position: sticky; top: 90px; }
    .facts { display: grid; gap: 0.5rem; margin: 1rem 0; }
    .facts div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }
    .facts dt { color: var(--muted); } .facts dd { margin: 0; font-weight: 600; text-align: right; }
    .allergy { background: var(--danger-soft); color: var(--danger); padding: 0.6rem 0.8rem; border-radius: 12px; font-weight: 600; display: flex; gap: 0.4rem; align-items: center; }
    .rx { display: grid; grid-template-columns: 2fr 1fr 1.4fr 80px 44px; gap: 0.5rem; align-items: end; }
    @media (max-width: 700px) { .rx { grid-template-columns: 1fr 1fr; } }
    .bill { display: grid; grid-template-columns: 2fr 1fr 44px; gap: 0.5rem; align-items: end; }
    .sec { border-top: 1px solid var(--line); padding-top: 1rem; margin-top: 1rem; }
    .history li { font-size: 0.9rem; }
  `,
})
export class Consult {
  id = input.required<string>();
  store = inject(Store);
  private ns = inject(NotificationService);
  private router = inject(Router);

  appt = computed(() => this.store.appointments().find((a) => a.id === this.id() && a.doctorId === this.store.me()?.id));
  patient = computed(() => this.store.user(this.appt()?.patientId));
  age = computed(() => ageFrom(this.patient()?.dob));
  history = computed(() => this.store.records().filter((r) => r.patientId === this.patient()?.id).sort((a, b) => b.date.localeCompare(a.date)));

  vitals = { bp: '', pulse: '', temp: '', weight: '' };
  diagnosis = '';
  notes = '';
  rx: Prescription[] = [];
  extra: InvoiceItem[] = [];

  addRx() { this.rx.push({ drug: '', dose: '', frequency: 'Twice daily', days: 5 }); }
  addCharge() { this.extra.push({ label: '', amount: 0 }); }

  finish() {
    if (!this.diagnosis.trim()) return this.ns.warn('Add a diagnosis before completing the visit.');
    const prescriptions = this.rx.filter((p) => p.drug.trim());
    const extra = this.extra.filter((x) => x.label.trim() && x.amount > 0);
    const ok = this.ns.attempt(
      () => this.store.completeVisit(this.id(), { diagnosis: this.diagnosis.trim(), notes: this.notes.trim(), vitals: this.vitals, prescriptions }, extra),
      'Visit completed — record saved and invoice sent to billing.',
    );
    if (ok) this.router.navigateByUrl('/app');
  }
}
