import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Appointment, AppointmentStatus } from '../core/models';
import { NotificationService } from '../core/notification.service';
import { Store } from '../core/store';
import { isoDate } from '../core/scheduling';

/** Appointment list with the actions each role is allowed to take. */
@Component({
  selector: 'app-appt-list',
  imports: [RouterLink],
  template: `
    @if (items().length) {
      <ul class="list">
        @for (a of items(); track a.id; let i = $index) {
          <li class="list-item appt rise" [style.--i]="i">
            <div class="date" [class.today]="a.date === today">
              <span class="d">{{ day(a.date) }}</span><span class="m">{{ month(a.date) }}</span>
            </div>
            <div class="grow">
              <div class="row tight">
                <strong>{{ a.time }}</strong>
                <span class="badge" [class]="'badge ' + a.status">{{ a.status }}</span>
              </div>
              <div class="who">
                @if (role() !== 'doctor') { <span>{{ store.user(a.doctorId)?.name }}</span> }
                @if (role() !== 'patient') {
                  @if (role() !== 'doctor') { <span class="muted"> · </span> }
                  <a [routerLink]="['/app/patients', a.patientId]">{{ store.user(a.patientId)?.name }}</a>
                }
              </div>
              <div class="small muted reason">{{ a.reason }}</div>
            </div>
            <div class="actions">
              @switch (role()) {
                @case ('patient') {
                  @if (can(a, 'cancelled')) { <button class="btn ghost sm" (click)="move(a, 'cancelled')">Cancel</button> }
                }
                @case ('doctor') {
                  @if (a.status === 'pending') {
                    <button class="btn sm success" (click)="move(a, 'confirmed')">Confirm</button>
                    <button class="btn ghost sm" (click)="move(a, 'rejected')">Decline</button>
                  }
                  @if (a.status === 'confirmed' || a.status === 'checked-in') {
                    <a class="btn sm" [routerLink]="['/app/consult', a.id]"><span class="mi" aria-hidden="true">stethoscope</span>Consult</a>
                  }
                }
                @default {
                  @if (a.status === 'pending') { <button class="btn sm success" (click)="move(a, 'confirmed')">Confirm</button> }
                  @if (a.status === 'confirmed') { <button class="btn sm" (click)="move(a, 'checked-in')">Check in</button> }
                  @if (can(a, 'cancelled')) { <button class="btn ghost sm" (click)="move(a, 'cancelled')">Cancel</button> }
                }
              }
            </div>
          </li>
        }
      </ul>
    } @else {
      <div class="empty"><span class="mi" aria-hidden="true">event_busy</span>{{ empty() }}</div>
    }
  `,
  styles: `
    .appt { align-items: flex-start; }
    .date { width: 54px; flex: none; text-align: center; border-radius: 12px; padding: 0.35rem 0; background: var(--surface-2); border: 1px solid var(--line); }
    .date.today { background: var(--primary); color: #fff; border-color: var(--primary); }
    .date .d { display: block; font: 700 1.2rem/1.1 var(--font-head); }
    .date .m { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .tight { gap: 0.5rem; }
    .who { font-weight: 500; }
    .who a { color: inherit; }
    .reason { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; align-self: center; }
    @media (max-width: 640px) { .appt { flex-wrap: wrap; } .actions { width: 100%; justify-content: flex-start; } }
  `,
})
export class ApptList {
  store = inject(Store);
  private ns = inject(NotificationService);
  items = input.required<Appointment[]>();
  empty = input('No appointments here yet.');
  role = computed(() => this.store.me()?.role);
  today = isoDate(new Date());

  day = (d: string) => d.slice(8);
  month = (d: string) => new Date(d + 'T00:00:00').toLocaleString('en', { month: 'short' });
  can = (a: Appointment, to: AppointmentStatus) =>
    (to === 'cancelled' ? ['pending', 'confirmed'] : []).includes(a.status) && a.date >= this.today;

  move(a: Appointment, to: AppointmentStatus) {
    const label: Partial<Record<AppointmentStatus, string>> = {
      confirmed: 'Appointment confirmed', rejected: 'Appointment declined', cancelled: 'Appointment cancelled', 'checked-in': 'Patient checked in',
    };
    this.ns.attempt(() => this.store.setStatus(a.id, to), label[to]);
  }
}
