import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { User } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { InitialsPipe, ageFrom } from '../../shared/format';

@Component({
  selector: 'app-patients',
  imports: [FormsModule, RouterLink, InitialsPipe],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ isDoctor() ? 'My patients' : 'Patients' }}</h1>
        <p>{{ isDoctor() ? 'Everyone who has booked with you.' : 'All registered patients.' }}</p>
      </div>
      @if (!isDoctor()) {
        <button class="btn" type="button" (click)="adding.set(!adding())" [attr.aria-expanded]="adding()">
          <span class="mi" aria-hidden="true">{{ adding() ? 'close' : 'person_add' }}</span>{{ adding() ? 'Close' : 'Register patient' }}
        </button>
      }
    </div>

    @if (adding()) {
      <form class="card add rise" #f="ngForm" (ngSubmit)="f.valid && add(f)" novalidate>
        <h2>Register walk-in patient</h2>
        <div class="form-grid">
          <label class="field"><span>Full name</span><input class="input" name="name" required [(ngModel)]="draft.name" /></label>
          <label class="field"><span>Email</span><input class="input" type="email" name="email" required email [(ngModel)]="draft.email" /></label>
          <label class="field"><span>Phone</span><input class="input" type="tel" name="phone" required [(ngModel)]="draft.phone" /></label>
          <label class="field"><span>Date of birth</span><input class="input" type="date" name="dob" required [(ngModel)]="draft.dob" /></label>
          <label class="field"><span>Gender</span>
            <select class="input" name="gender" [(ngModel)]="draft.gender"><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select>
          </label>
          <label class="field"><span>Blood group</span>
            <select class="input" name="bg" [(ngModel)]="draft.bloodGroup"><option value="">Unknown</option>@for (b of groups; track b) { <option>{{ b }}</option> }</select>
          </label>
          <label class="field full"><span>Allergies</span><input class="input" name="allergies" placeholder="None known" [(ngModel)]="draft.allergies" /></label>
        </div>
        <p class="small muted">A temporary password is generated; give it to the patient so they can sign in and change it.</p>
        <button class="btn" type="submit">Register</button>
      </form>
    }

    <div class="card">
      <label class="field search">
        <span class="sr-only">Search patients</span>
        <input class="input" type="search" placeholder="Search by name, email or phone" [ngModel]="q()" (ngModelChange)="q.set($event)" />
      </label>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Patient</th><th>Age</th><th>Blood</th><th>Phone</th><th>Visits</th><th><span class="sr-only">Open</span></th></tr></thead>
          <tbody>
            @for (p of list(); track p.id; let i = $index) {
              <tr class="rise" [style.--i]="i">
                <td><div class="row"><span class="avatar">{{ p.name | initials }}</span><div><strong>{{ p.name }}</strong><div class="small muted">{{ p.email }}</div></div></div></td>
                <td>{{ age(p.dob) ?? '—' }}</td>
                <td>{{ p.bloodGroup || '—' }}</td>
                <td>{{ p.phone || '—' }}</td>
                <td>{{ visits(p.id) }}</td>
                <td><a class="btn ghost sm" [routerLink]="['/app/patients', p.id]">Open</a></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No patients found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `.add { margin-bottom: 1rem; } .add .btn { margin-top: 0.5rem; } .search { margin-bottom: 1rem; max-width: 420px; }`,
})
export class Patients {
  store = inject(Store);
  private ns = inject(NotificationService);
  isDoctor = computed(() => this.store.me()?.role === 'doctor');
  q = signal('');
  adding = signal(false);
  draft: Partial<User> = { gender: 'female', bloodGroup: '' };
  groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  age = ageFrom;

  list = computed(() => {
    const me = this.store.me()!;
    const mine = new Set(this.store.appointments().filter((a) => a.doctorId === me.id).map((a) => a.patientId));
    const q = this.q().trim().toLowerCase();
    return this.store
      .patients()
      .filter((p) => !this.isDoctor() || mine.has(p.id))
      .filter((p) => !q || `${p.name} ${p.email} ${p.phone}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
  visits = (id: string) => this.store.appointments().filter((a) => a.patientId === id && a.status === 'completed').length;

  async add(f: NgForm) {
    const temp = 'Kosa-' + crypto.randomUUID().slice(0, 6);
    try {
      await this.store.createUser({ ...this.draft, role: 'patient', name: this.draft.name!, email: this.draft.email! }, temp);
      this.ns.success(`Temporary password: ${temp}`, `${this.draft.name} registered`);
      f.resetForm({ gender: 'female', bloodGroup: '' });
      this.adding.set(false);
    } catch (e) {
      this.ns.error((e as Error).message);
    }
  }
}
