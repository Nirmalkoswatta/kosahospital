import { Component, computed, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { InitialsPipe } from '../../shared/format';
import { Tilt } from '../../shared/tilt';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, InitialsPipe, Tilt],
  template: `
    <div class="page-head"><div><h1>Profile</h1><p>Your details and password.</p></div></div>
    <div class="grid cols-2">
      <form class="card rise" (ngSubmit)="save()">
        <div class="row head">
          <span class="avatar lg" appTilt="12">{{ me().name | initials }}</span>
          <div><h2>{{ me().name }}</h2><div class="small muted">{{ me().email }}</div></div>
        </div>
        <div class="form-grid">
          <label class="field"><span>Full name</span><input class="input" name="name" required [(ngModel)]="d.name" /></label>
          <label class="field"><span>Phone</span><input class="input" type="tel" name="phone" [(ngModel)]="d.phone" /></label>
          @if (me().role === 'patient') {
            <label class="field"><span>Date of birth</span><input class="input" type="date" name="dob" [(ngModel)]="d.dob" /></label>
            <label class="field"><span>Blood group</span>
              <select class="input" name="bg" [(ngModel)]="d.bloodGroup"><option value="">Unknown</option>@for (b of groups; track b) { <option>{{ b }}</option> }</select>
            </label>
            <label class="field full"><span>Address</span><input class="input" name="addr" [(ngModel)]="d.address" /></label>
            <label class="field full"><span>Allergies</span><input class="input" name="allergies" placeholder="None known" [(ngModel)]="d.allergies" /></label>
            <label class="field full"><span>Emergency contact</span><input class="input" name="ec" placeholder="Name — phone" [(ngModel)]="d.emergencyContact" /></label>
          }
          @if (me().role === 'doctor') {
            <label class="field full"><span>Bio</span><textarea class="input" name="bio" [(ngModel)]="d.bio"></textarea></label>
          }
        </div>
        <button class="btn mt" type="submit">Save changes</button>
      </form>

      <div class="stack">
        <form class="card rise" style="--i: 1" #pf="ngForm" (ngSubmit)="pf.valid && changePw(pf)">
          <h2>Change password</h2>
          <div class="stack">
            <label class="field"><span>Current password</span><input class="input" type="password" name="cur" required autocomplete="current-password" [(ngModel)]="pw.current" /></label>
            <label class="field"><span>New password</span><input class="input" type="password" name="next" required minlength="8" autocomplete="new-password" [(ngModel)]="pw.next" /><small class="hint">At least 8 characters.</small></label>
          </div>
          <button class="btn mt" type="submit">Update password</button>
        </form>
        @if (me().role === 'admin') {
          <section class="card danger-zone rise" style="--i: 2">
            <h2>Demo data</h2>
            <p class="small muted">Wipes every account, appointment, record and invoice in this browser and restores the sample hospital.</p>
            <button class="btn danger" type="button" (click)="reset()"><span class="mi" aria-hidden="true">restart_alt</span>Reset demo data</button>
          </section>
        }
      </div>
    </div>
  `,
  styles: `.mt { margin-top: 1rem; } .head { margin-bottom: 1.25rem; } .head h2 { margin: 0; } .danger-zone { border-color: color-mix(in srgb, var(--danger) 30%, var(--line)); }`,
})
export class Profile {
  private store = inject(Store);
  private ns = inject(NotificationService);
  private router = inject(Router);
  me = computed(() => this.store.me()!);
  d: Partial<User> = { ...this.store.me()! };
  pw = { current: '', next: '' };
  groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  private armed = false;

  save() {
    if (!this.d.name?.trim()) return this.ns.warn('Name is required.');
    const { name, phone, dob, bloodGroup, address, allergies, emergencyContact, bio } = this.d;
    this.store.updateUser(this.me().id, { name: name!.trim(), phone, dob, bloodGroup, address, allergies, emergencyContact, bio });
    this.ns.success('Profile updated');
  }

  async changePw(f: NgForm) {
    try {
      await this.store.changePassword(this.me().id, this.pw.current, this.pw.next);
      this.ns.success('Password updated');
      f.resetForm();
    } catch (e) {
      this.ns.error((e as Error).message);
    }
  }

  // two-tap confirm instead of window.confirm()
  async reset() {
    if (!this.armed) {
      this.armed = true;
      this.ns.warn('Tap Reset again within 5 seconds to confirm.');
      setTimeout(() => (this.armed = false), 5000);
      return;
    }
    await this.router.navigateByUrl('/');
    await this.store.resetDemo();
    this.ns.success('Demo data restored. Sign in again.');
    this.router.navigateByUrl('/login');
  }
}
