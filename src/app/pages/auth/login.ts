import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { DEMO_PASSWORD, Store } from '../../core/store';
import { AuthVisual } from './auth-visual';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthVisual],
  styleUrl: './auth.scss',
  template: `
    <app-auth-visual heading="Welcome back to Kosa." text="Patients, doctors, staff and admins all sign in here — you land in the portal for your role." />
    <main class="panel">
      <form class="form rise" #f="ngForm" (ngSubmit)="f.valid && submit()" novalidate>
        <div>
          <h1>Sign in</h1>
          <p class="muted">Use the email your account was created with.</p>
        </div>
        @if (error()) {
          <div class="alert" role="alert"><span class="mi" aria-hidden="true">error</span>{{ error() }}</div>
        }
        <label class="field">
          <span>Email</span>
          <input class="input" type="email" name="email" autocomplete="email" required email [(ngModel)]="email" #em="ngModel" />
          @if (em.touched && em.invalid) { <small class="err">Enter a valid email address.</small> }
        </label>
        <label class="field">
          <span>Password</span>
          <div class="pw">
            <input class="input" [type]="show() ? 'text' : 'password'" name="password" autocomplete="current-password" required [(ngModel)]="password" #pw="ngModel" />
            <button type="button" class="icon-btn" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
              <span class="mi" aria-hidden="true">{{ show() ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
          @if (pw.touched && pw.invalid) { <small class="err">Enter your password.</small> }
        </label>
        <button class="btn" type="submit" [disabled]="busy()">
          @if (busy()) { Signing in… } @else { Sign in <span class="mi" aria-hidden="true">arrow_forward</span> }
        </button>
        <div class="demo">
          <p>Demo accounts (password <code>{{ demoPw }}</code>) — tap to fill:</p>
          <div class="chips">
            @for (d of demo; track d.email) {
              <button type="button" class="chip" (click)="email = d.email; password = demoPw">{{ d.label }}</button>
            }
          </div>
        </div>
        <p class="switch">New patient? <a routerLink="/register">Create an account</a></p>
      </form>
    </main>
  `,
})
export class Login {
  private store = inject(Store);
  private router = inject(Router);
  private ns = inject(NotificationService);
  email = '';
  password = '';
  show = signal(false);
  busy = signal(false);
  error = signal('');
  demoPw = DEMO_PASSWORD;
  demo = [
    { label: 'Patient', email: 'patient@kosa.lk' },
    { label: 'Doctor', email: 'dr.rajapaksha@kosa.lk' },
    { label: 'Front desk', email: 'reception@kosa.lk' },
    { label: 'Admin', email: 'admin@kosa.lk' },
  ];

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      const u = await this.store.login(this.email, this.password);
      this.ns.success(`Signed in as ${u.name}`);
      this.router.navigateByUrl('/app');
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
