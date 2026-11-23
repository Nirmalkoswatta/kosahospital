import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { isoDate } from '../../core/scheduling';
import { AuthVisual } from './auth-visual';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, AuthVisual],
  styleUrl: './auth.scss',
  template: `
    <app-auth-visual heading="Your health, in one place." text="Create a patient account to book visits, see prescriptions and pay bills. Doctor and staff accounts are created by the hospital admin." />
    <main class="panel">
      <form class="form rise" #f="ngForm" (ngSubmit)="f.valid && match() && submit()" novalidate>
        <div>
          <h1>Create patient account</h1>
          <p class="muted">Takes under a minute.</p>
        </div>
        @if (error()) {
          <div class="alert" role="alert"><span class="mi" aria-hidden="true">error</span>{{ error() }}</div>
        }
        <div class="form-grid">
          <label class="field full">
            <span>Full name</span>
            <input class="input" name="name" autocomplete="name" required minlength="2" [(ngModel)]="u.name" #n="ngModel" />
            @if (n.touched && n.invalid) { <small class="err">Enter your full name.</small> }
          </label>
          <label class="field">
            <span>Email</span>
            <input class="input" type="email" name="email" autocomplete="email" required email [(ngModel)]="u.email" #em="ngModel" />
            @if (em.touched && em.invalid) { <small class="err">Enter a valid email.</small> }
          </label>
          <label class="field">
            <span>Phone</span>
            <input class="input" type="tel" name="phone" autocomplete="tel" required pattern="[+0-9 ]{9,16}" [(ngModel)]="u.phone" #ph="ngModel" />
            @if (ph.touched && ph.invalid) { <small class="err">Enter a phone number, e.g. +94 77 123 4567.</small> }
          </label>
          <label class="field">
            <span>Date of birth</span>
            <input class="input" type="date" name="dob" required [max]="today" [(ngModel)]="u.dob" #dob="ngModel" />
            @if (dob.touched && dob.invalid) { <small class="err">Pick your date of birth.</small> }
          </label>
          <label class="field">
            <span>Gender</span>
            <select class="input" name="gender" [(ngModel)]="u.gender">
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other / prefer not to say</option>
            </select>
          </label>
          <label class="field">
            <span>Password</span>
            <input class="input" type="password" name="password" autocomplete="new-password" required minlength="8" [(ngModel)]="password" #pw="ngModel" />
            <small class="hint">At least 8 characters.</small>
          </label>
          <label class="field">
            <span>Confirm password</span>
            <input class="input" type="password" name="confirm" autocomplete="new-password" required [(ngModel)]="confirm" #cf="ngModel" />
            @if (cf.touched && !match()) { <small class="err">Passwords do not match.</small> }
          </label>
        </div>
        <button class="btn" type="submit" [disabled]="busy()">
          @if (busy()) { Creating… } @else { Create account <span class="mi" aria-hidden="true">arrow_forward</span> }
        </button>
        <p class="switch">Already registered? <a routerLink="/login">Sign in</a></p>
      </form>
    </main>
  `,
})
export class Register {
  private store = inject(Store);
  private router = inject(Router);
  private ns = inject(NotificationService);
  u: Partial<User> = { gender: 'female' };
  password = '';
  confirm = '';
  today = isoDate(new Date());
  busy = signal(false);
  error = signal('');
  match = () => this.password === this.confirm;

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.store.registerPatient({ ...this.u, name: this.u.name!, email: this.u.email! }, this.password);
      this.ns.success('Account created — welcome to Kosa!');
      this.router.navigateByUrl('/app');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
