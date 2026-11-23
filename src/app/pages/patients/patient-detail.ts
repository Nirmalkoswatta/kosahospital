import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { invoiceTotal } from '../../core/models';
import { Store } from '../../core/store';
import { ApptList } from '../../shared/appt-list';
import { InitialsPipe, LkrPipe, ageFrom } from '../../shared/format';
import { Tilt } from '../../shared/tilt';

type Tab = 'records' | 'appointments' | 'bills';

/** Patient chart. Used for /app/patients/:id (care team) and /app/records (patient's own). */
@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, ApptList, InitialsPipe, LkrPipe, Tilt],
  template: `
    @if (patient(); as p) {
      <div class="page-head">
        <div>
          <h1>{{ self() ? 'My medical records' : p.name }}</h1>
          <p>{{ self() ? 'Every visit, diagnosis and prescription from Kosa.' : 'Patient chart' }}</p>
        </div>
        @if (!self()) { <a class="btn ghost" routerLink="/app/patients"><span class="mi" aria-hidden="true">arrow_back</span>All patients</a> }
      </div>

      <div class="layout">
        <aside class="card id-card rise" appTilt="5">
          <span class="avatar lg pop">{{ p.name | initials }}</span>
          <h2 class="pop">{{ p.name }}</h2>
          <p class="small muted">{{ p.email }}</p>
          <dl class="facts">
            <div><dt>Age</dt><dd>{{ age() ?? '—' }}</dd></div>
            <div><dt>Gender</dt><dd>{{ p.gender || '—' }}</dd></div>
            <div><dt>Blood group</dt><dd>{{ p.bloodGroup || '—' }}</dd></div>
            <div><dt>Phone</dt><dd>{{ p.phone || '—' }}</dd></div>
            <div><dt>Address</dt><dd>{{ p.address || '—' }}</dd></div>
            <div><dt>Emergency</dt><dd>{{ p.emergencyContact || '—' }}</dd></div>
          </dl>
          @if (p.allergies) { <p class="allergy"><span class="mi" aria-hidden="true">warning</span>{{ p.allergies }}</p> }
        </aside>

        <section class="grow">
          <div class="tabs" role="group" aria-label="Chart section">
            <button type="button" [attr.aria-pressed]="tab() === 'records'" (click)="tab.set('records')">Records ({{ records().length }})</button>
            <button type="button" [attr.aria-pressed]="tab() === 'appointments'" (click)="tab.set('appointments')">Appointments ({{ appts().length }})</button>
            @if (!isDoctor()) { <button type="button" [attr.aria-pressed]="tab() === 'bills'" (click)="tab.set('bills')">Bills ({{ bills().length }})</button> }
          </div>

          <div class="panel">
            @switch (tab()) {
              @case ('records') {
                <ol class="timeline">
                  @for (r of records(); track r.id; let i = $index) {
                    <li class="card rise" [style.--i]="i">
                      <div class="card-head">
                        <div><h3>{{ r.diagnosis }}</h3><div class="small muted">{{ r.date }} · {{ store.user(r.doctorId)?.name }}</div></div>
                      </div>
                      @if (r.notes) { <p>{{ r.notes }}</p> }
                      <div class="vitals">
                        @if (r.vitals.bp) { <span class="badge">BP {{ r.vitals.bp }}</span> }
                        @if (r.vitals.pulse) { <span class="badge">Pulse {{ r.vitals.pulse }}</span> }
                        @if (r.vitals.temp) { <span class="badge">{{ r.vitals.temp }} °C</span> }
                        @if (r.vitals.weight) { <span class="badge">{{ r.vitals.weight }} kg</span> }
                      </div>
                      @if (r.prescriptions.length) {
                        <ul class="list rx">
                          @for (m of r.prescriptions; track $index) {
                            <li class="list-item"><span class="mi" aria-hidden="true">medication</span><div><strong>{{ m.drug }} {{ m.dose }}</strong><div class="small muted">{{ m.frequency }} · {{ m.days }} days</div></div></li>
                          }
                        </ul>
                      }
                    </li>
                  } @empty {
                    <li class="card empty"><span class="mi" aria-hidden="true">clinical_notes</span>No visit records yet.</li>
                  }
                </ol>
              }
              @case ('appointments') { <div class="card"><app-appt-list [items]="appts()" /></div> }
              @case ('bills') {
                <ul class="list">
                  @for (b of bills(); track b.id) {
                    <li class="list-item"><span class="mi" aria-hidden="true">receipt_long</span><div class="grow"><strong>{{ total(b) | lkr }}</strong><div class="small muted">{{ b.items[0]?.label }}{{ b.items.length > 1 ? ' +' + (b.items.length - 1) : '' }}</div></div><span class="badge" [class]="'badge ' + b.status">{{ b.status }}</span></li>
                  } @empty {
                    <li class="card empty">No bills.</li>
                  }
                </ul>
                <a routerLink="/app/billing" class="small">Go to billing</a>
              }
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="card empty"><span class="mi" aria-hidden="true">lock</span>Patient not found, or not under your care.</div>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 1rem; align-items: start; }
    @media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
    .id-card { text-align: center; display: grid; justify-items: center; }
    .id-card h2 { margin: 0.75rem 0 0; }
    .facts { width: 100%; display: grid; gap: 0.5rem; margin: 1rem 0; text-align: left; }
    .facts div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.9rem; }
    .facts dt { color: var(--muted); } .facts dd { margin: 0; font-weight: 600; text-align: right; }
    .allergy { width: 100%; background: var(--danger-soft); color: var(--danger); padding: 0.6rem 0.8rem; border-radius: 12px; font-weight: 600; display: flex; gap: 0.4rem; align-items: center; justify-content: center; }
    .panel { margin-top: 1rem; perspective: 1400px; }
    .timeline { list-style: none; padding: 0 0 0 1.25rem; margin: 0; display: grid; gap: 1rem; border-left: 2px solid var(--line); }
    .timeline > li { position: relative; }
    .timeline > li::before { content: ''; position: absolute; left: calc(-1.25rem - 7px); top: 1.5rem; width: 12px; height: 12px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft); }
    .vitals { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
    .vitals .badge::before { display: none; }
    .rx { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  `,
})
export class PatientDetail {
  id = input<string>(); // absent on /app/records
  store = inject(Store);
  tab = signal<Tab>('records');
  self = computed(() => !this.id());
  isDoctor = computed(() => this.store.me()?.role === 'doctor');

  patient = computed(() => {
    const me = this.store.me()!;
    const p = this.store.user(this.id() ?? me.id);
    if (!p || p.role !== 'patient') return undefined;
    // doctors may only open charts of patients who booked with them
    if (me.role === 'doctor' && !this.store.appointments().some((a) => a.doctorId === me.id && a.patientId === p.id)) return undefined;
    return p;
  });
  age = computed(() => ageFrom(this.patient()?.dob));
  records = computed(() => this.store.records().filter((r) => r.patientId === this.patient()?.id).sort((a, b) => b.date.localeCompare(a.date)));
  appts = computed(() => this.store.appointments().filter((a) => a.patientId === this.patient()?.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
  bills = computed(() => this.store.invoices().filter((i) => i.patientId === this.patient()?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  total = invoiceTotal;
}
