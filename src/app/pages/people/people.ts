import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { InitialsPipe, LkrPipe } from '../../shared/format';
import { Tilt } from '../../shared/tilt';

/** Admin: manage doctors (/people/doctors) or staff (/people/staff). */
@Component({
  selector: 'app-people',
  imports: [FormsModule, InitialsPipe, LkrPipe, Tilt],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ isDoc() ? 'Doctors' : 'Staff' }}</h1>
        <p>Create accounts and enable or disable access.</p>
      </div>
      <button class="btn" type="button" (click)="adding.set(!adding())" [attr.aria-expanded]="adding()">
        <span class="mi" aria-hidden="true">{{ adding() ? 'close' : 'person_add' }}</span>{{ adding() ? 'Close' : isDoc() ? 'Add doctor' : 'Add staff member' }}
      </button>
    </div>

    @if (adding()) {
      <form class="card add rise" #f="ngForm" (ngSubmit)="f.valid && add(f)" novalidate>
        <div class="form-grid">
          <label class="field"><span>Full name</span><input class="input" name="name" required [(ngModel)]="draft.name" [placeholder]="isDoc() ? 'Dr. …' : ''" /></label>
          <label class="field"><span>Email (sign-in)</span><input class="input" type="email" name="email" required email [(ngModel)]="draft.email" /></label>
          <label class="field"><span>Phone</span><input class="input" type="tel" name="phone" [(ngModel)]="draft.phone" /></label>
          @if (isDoc()) {
            <label class="field"><span>Department</span>
              <select class="input" name="dept" required [(ngModel)]="draft.departmentId">
                @for (d of store.departments(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
              </select>
            </label>
            <label class="field"><span>Specialty</span><input class="input" name="spec" required [(ngModel)]="draft.specialty" /></label>
            <label class="field"><span>Consultation fee (LKR)</span><input class="input" type="number" min="0" name="fee" required [(ngModel)]="draft.fee" /></label>
            <label class="field"><span>Years of experience</span><input class="input" type="number" min="0" name="exp" [(ngModel)]="draft.experience" /></label>
            <label class="field full"><span>Short bio</span><input class="input" name="bio" [(ngModel)]="draft.bio" /></label>
          } @else {
            <label class="field"><span>Position</span><input class="input" name="pos" required placeholder="e.g. Receptionist" [(ngModel)]="draft.position" /></label>
          }
          <label class="field"><span>Initial password</span><input class="input" type="text" name="pw" required minlength="8" autocomplete="off" [(ngModel)]="password" /><small class="hint">Share it privately; they can change it in Profile.</small></label>
        </div>
        <button class="btn mt" type="submit">Create account</button>
      </form>
    }

    <div class="grid cols-3">
      @for (u of list(); track u.id; let i = $index) {
        <article class="card person rise" [style.--i]="i" [class.off]="!u.active" appTilt="5">
          <div class="row">
            <span class="avatar lg pop">{{ u.name | initials }}</span>
            <div class="grow">
              <h3>{{ u.name }}</h3>
              <div class="small muted">{{ isDoc() ? u.specialty : u.position }}</div>
            </div>
          </div>
          <dl class="facts">
            <div><dt>Email</dt><dd>{{ u.email }}</dd></div>
            @if (isDoc()) {
              <div><dt>Department</dt><dd>{{ store.department(u.departmentId)?.name }}</dd></div>
              <div><dt>Fee</dt><dd>{{ u.fee ?? 0 | lkr }}</dd></div>
              <div><dt>Visits done</dt><dd>{{ done(u.id) }}</dd></div>
            }
          </dl>
          <div class="row">
            <span class="badge" [class.completed]="u.active" [class.cancelled]="!u.active">{{ u.active ? 'Active' : 'Disabled' }}</span>
            <span class="grow"></span>
            <button class="btn ghost sm" type="button" (click)="toggle(u)">{{ u.active ? 'Disable' : 'Enable' }}</button>
          </div>
        </article>
      }
    </div>
  `,
  styles: `
    .add { margin-bottom: 1rem; } .mt { margin-top: 1rem; }
    .person h3 { margin: 0; }
    .person.off { opacity: 0.6; }
    .facts { display: grid; gap: 0.35rem; margin: 1rem 0; font-size: 0.875rem; }
    .facts div { display: flex; justify-content: space-between; gap: 1rem; }
    .facts dt { color: var(--muted); } .facts dd { margin: 0; font-weight: 600; text-align: right; overflow-wrap: anywhere; }
  `,
})
export class People {
  kind = input.required<string>();
  store = inject(Store);
  private ns = inject(NotificationService);
  isDoc = computed(() => this.kind() === 'doctors');
  list = computed(() => (this.isDoc() ? this.store.doctors() : this.store.staff()));
  adding = signal(false);
  draft: Partial<User> = { departmentId: 'genm', fee: 2500, experience: 1 };
  password = '';

  done = (id: string) => this.store.appointments().filter((a) => a.doctorId === id && a.status === 'completed').length;

  async add(f: NgForm) {
    try {
      const role = this.isDoc() ? 'doctor' : 'staff';
      await this.store.createUser({ ...this.draft, fee: Number(this.draft.fee) || 0, experience: Number(this.draft.experience) || 0, role, name: this.draft.name!, email: this.draft.email! }, this.password);
      this.ns.success(`${this.draft.name} can now sign in.`, 'Account created');
      f.resetForm({ departmentId: 'genm', fee: 2500, experience: 1 });
      this.adding.set(false);
    } catch (e) {
      this.ns.error((e as Error).message);
    }
  }

  toggle(u: User) {
    this.store.updateUser(u.id, { active: !u.active });
    this.ns.info(`${u.name} ${u.active ? 'disabled' : 'enabled'}.`);
  }
}
