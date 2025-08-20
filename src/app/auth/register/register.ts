
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, UserRecord } from '../auth';
import { DataService, Doctor } from '../../core/data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {

  form: Partial<UserRecord & { confirm?: string }> = { role: 'patient' };

  doctors: Doctor[] = [];

  constructor(private auth: Auth, private router: Router, private data: DataService) {
    this.doctors = this.data.getDoctors();
  }

  async register() {
    // basic client-side checks
    if (!this.form.email || !this.form.password) return;
    if (this.form.password !== this.form.confirm) return;
    // role-specific validation
    if (this.form.role === 'patient') {
      if (!this.form.disease || !this.form.doctorId) return;
    }
    if (this.form.role === 'doctor') {
      if (!this.form.speciality) return;
    }

    const record = this.form as UserRecord;

    // If doctor: create doctor entry first so we can set doctorId on user profile before registration
    if (record.role === 'doctor') {
      const doctorId = Math.random().toString(36).slice(2, 9);
      const d: Doctor = {
        id: doctorId,
        name: record.name || record.email || ('Dr ' + record.email),
        email: record.email,
        speciality: (record as any).speciality
      };
      this.data.addDoctor(d);
      record.doctorId = doctorId;
    }

    try {
      const res = await this.auth.register(record as UserRecord);
      // after successful register, if patient add to patients store
      if (record.role === 'patient') {
        const p: any = {
          id: Math.random().toString(36).slice(2, 9),
          name: record.name || record.email,
          email: record.email,
          age: record.age,
          phone: record.phone,
          gender: record.gender,
          province: record.province,
          city: record.city,
          disease: record.disease,
          doctorId: (record as any).doctorId
        };
        this.data.addPatient(p);
      }
      // navigate to login
      this.router.navigate(['/login']);
    } catch (e) {
      // ignore and still navigate for demo; in real app show error
      this.router.navigate(['/login']);
    }
  }

  isFormValid() {
    if (!this.form.email || !this.form.password || !this.form.confirm) return false;
    if (this.form.password !== this.form.confirm) return false;
    const role = this.form.role || 'patient';
    if (role === 'patient') {
      return !!(this.form.disease && this.form.doctorId);
    }
    if (role === 'doctor') {
      return !!this.form.speciality;
    }
    return true;
  }

}
    