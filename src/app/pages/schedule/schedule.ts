import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { workingSlots, isoDate } from '../../core/scheduling';

@Component({
  selector: 'app-schedule',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div><h1>My schedule</h1><p>Patients can only book inside these hours.</p></div>
    </div>
    <div class="grid cols-2">
      <form class="card rise" (ngSubmit)="save()">
        <h2>Working days</h2>
        <div class="chips" role="group" aria-label="Working days">
          @for (d of dayNames; track d; let i = $index) {
            <button type="button" class="chip" [attr.aria-pressed]="days().includes(i)" (click)="toggle(i)">{{ d }}</button>
          }
        </div>
        <div class="form-grid mt">
          <label class="field"><span>Start</span>
            <select class="input" name="start" [(ngModel)]="start">@for (h of hours; track h) { <option [ngValue]="h">{{ pad(h) }}:00</option> }</select>
          </label>
          <label class="field"><span>End</span>
            <select class="input" name="end" [(ngModel)]="end">@for (h of hours; track h) { <option [ngValue]="h">{{ pad(h) }}:00</option> }</select>
          </label>
          <label class="field"><span>Visit length</span>
            <select class="input" name="slot" [(ngModel)]="slot">@for (m of [15, 20, 30, 45, 60]; track m) { <option [ngValue]="m">{{ m }} min</option> }</select>
          </label>
          <label class="field"><span>Fee (LKR)</span><input class="input" type="number" min="0" name="fee" [(ngModel)]="fee" /></label>
        </div>
        <button class="btn mt" type="submit"><span class="mi" aria-hidden="true">save</span>Save schedule</button>
      </form>
      <section class="card rise" style="--i: 1">
        <h2>Preview — {{ previewLabel }}</h2>
        <p class="small muted">{{ preview().length }} bookable slots. Existing bookings are kept if you change hours.</p>
        <div class="chips">
          @for (t of preview(); track t; let i = $index) { <span class="chip rise" [style.--i]="i">{{ t }}</span> }
          @empty { <p class="muted">Not working this day.</p> }
        </div>
      </section>
    </div>
  `,
  styles: `.mt { margin-top: 1rem; } span.chip { cursor: default; display: inline-flex; align-items: center; }`,
})
export class Schedule {
  private store = inject(Store);
  private ns = inject(NotificationService);
  private me = this.store.me()!;
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  hours = Array.from({ length: 17 }, (_, i) => i + 6); // 06–22
  days = signal<number[]>(this.me.workDays ?? []);
  start = this.me.startHour ?? 9;
  end = this.me.endHour ?? 17;
  slot = this.me.slotMins ?? 30;
  fee = this.me.fee ?? 0;
  private tomorrow = isoDate(new Date(Date.now() + 86400000));
  previewLabel = new Date(this.tomorrow + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  // plain method (not computed): start/end/slot are ngModel fields, so re-read them each render
  preview = () =>
    workingSlots({ ...this.me, active: true, workDays: this.days(), startHour: this.start, endHour: this.end, slotMins: this.slot }, this.tomorrow);

  pad = (h: number) => String(h).padStart(2, '0');
  toggle(i: number) {
    this.days.update((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));
  }
  save() {
    if (this.end <= this.start) return this.ns.warn('End time must be after start time.');
    this.store.updateUser(this.me.id, { workDays: this.days(), startHour: this.start, endHour: this.end, slotMins: this.slot, fee: Number(this.fee) || 0 });
    this.ns.success('Schedule saved');
  }
}
