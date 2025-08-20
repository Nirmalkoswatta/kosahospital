import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { DataService } from '../../core/data';
import { Auth } from '../../auth/auth';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  userName = 'Patient';
  upcoming = 'No upcoming appointments';

  doctors = [] as any[];
  private unsubDoctors: any = null;

  constructor(private data: DataService, private auth: Auth) {
  this.doctors = this.data.getDoctors();
  const u = this.auth.currentUser;
  if (u && u.name) this.userName = u.name;
    this.unsubDoctors = this.data.subscribe('doctors', () => {
      this.doctors = this.data.getDoctors();
    });
  }

  ngOnDestroy(): void {
    if (this.unsubDoctors) this.unsubDoctors();
  }

}
