import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { DataService, Appointment } from '../../core/data';
import { Auth } from '../../auth/auth';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  appointments: Appointment[] = [];

  private unsubAppointments: any = null;

  constructor(private data: DataService, private auth: Auth) {
    // show appointments for this doctor if logged in
    const user = this.auth.currentUser;
    const docs = this.data.getDoctors();
    const docId = (user && (user as any).doctorId) || (docs.length ? docs[0].id : null);
    this.appointments = this.data.getAppointments().filter(a => a.doctorId === docId);
    // subscribe to appointment changes to refresh automatically
    this.unsubAppointments = this.data.subscribe('appointments', () => {
      this.appointments = this.data.getAppointments().filter(a => a.doctorId === docId);
    });
  }

  accept(a: Appointment) {
    // accept with default values for demo
    const updated = this.data.acceptAppointment(a.id, a.datetime || new Date().toISOString(), a.amount || 0, 'Accepted by doctor');
    if (updated) {
      this.appointments = this.data.getAppointments().filter(x => x.doctorId === a.doctorId);
    }
  }
  ngOnDestroy(): void {
    if (this.unsubAppointments) this.unsubAppointments();
  }

}
