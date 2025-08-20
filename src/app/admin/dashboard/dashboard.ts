import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {

  recentPatients = [
    { name: 'Asha K.', age: 34 },
    { name: 'Ravi P.', age: 29 },
    { name: 'Maya S.', age: 45 }
  ];

  doctors = [
    { name: 'Suresh', specialty: 'Cardiology' },
    { name: 'Neha', specialty: 'Dermatology' },
    { name: 'Rahul', specialty: 'General' }
  ];

}
