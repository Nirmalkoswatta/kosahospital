import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { Tilt } from '../../shared/tilt';

@Component({
  selector: 'app-departments',
  imports: [FormsModule, Tilt],
  template: `
    <div class="page-head">
      <div><h1>Departments</h1><p>Clinics patients can book into.</p></div>
    </div>
    <form class="card add rise" #f="ngForm" (ngSubmit)="f.valid && add(f)">
      <div class="form-grid">
        <label class="field"><span>Name</span><input class="input" name="name" required [(ngModel)]="name" /></label>
        <label class="field"><span>Icon</span>
          <select class="input" name="icon" [(ngModel)]="icon">
            @for (i of icons; track i) { <option [value]="i">{{ i }}</option> }
          </select>
        </label>
        <label class="field full"><span>Description</span><input class="input" name="desc" required [(ngModel)]="description" /></label>
      </div>
      <button class="btn mt" type="submit"><span class="mi" aria-hidden="true">add</span>Add department</button>
    </form>
    <div class="grid cols-3">
      @for (d of store.departments(); track d.id; let i = $index) {
        <article class="card rise" [style.--i]="i" appTilt>
          <span class="ico pop"><span class="mi" aria-hidden="true">{{ d.icon }}</span></span>
          <h3 class="pop">{{ d.name }}</h3>
          <p class="muted small">{{ d.description }}</p>
          <p class="small"><strong>{{ doctors(d.id) }}</strong> doctor{{ doctors(d.id) === 1 ? '' : 's' }}</p>
        </article>
      }
    </div>
  `,
  styles: `
    .add { margin-bottom: 1rem; } .mt { margin-top: 1rem; }
    .ico { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; background: var(--primary-soft); color: var(--primary); margin-bottom: 0.75rem; }
  `,
})
export class Departments {
  store = inject(Store);
  private ns = inject(NotificationService);
  icons = ['local_hospital', 'cardiology', 'neurology', 'child_care', 'orthopedics', 'dermatology', 'stethoscope', 'ophthalmology', 'dentistry', 'pulmonology', 'gastroenterology', 'pregnant_woman', 'psychology', 'radiology', 'emergency'];
  name = '';
  icon = 'local_hospital';
  description = '';

  doctors = (id: string) => this.store.doctors().filter((d) => d.departmentId === id && d.active).length;

  add(f: NgForm) {
    try {
      this.store.addDepartment({ name: this.name.trim(), icon: this.icon, description: this.description.trim() });
      this.ns.success('Department added');
      f.resetForm({ icon: 'local_hospital' });
    } catch (e) {
      this.ns.error((e as Error).message);
    }
  }
}
