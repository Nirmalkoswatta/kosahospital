import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { DataService } from '../../core/data';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  doctors: any[] = [];
  patients: any[] = [];
  private unsubDoctors: any = null;
  private unsubPatients: any = null;

  constructor(private data: DataService) {
    this.doctors = this.data.getDoctors();
    this.patients = this.data.getPatients();
    this.unsubDoctors = this.data.subscribe('doctors', () => { this.doctors = this.data.getDoctors(); });
    this.unsubPatients = this.data.subscribe('patients', () => { this.patients = this.data.getPatients(); });
  }

  ngOnDestroy(): void {
    if (this.unsubDoctors) this.unsubDoctors();
    if (this.unsubPatients) this.unsubPatients();
  }

}
