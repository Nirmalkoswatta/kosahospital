
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../auth';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatOptionModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email = '';
  password = '';
  role: 'admin' | 'doctor' | 'patient' | 'employee' = 'patient';
  error = '';

  constructor(private auth: Auth, private router: Router) {}

  onLogin() {
    this.error = '';
    this.auth.login(this.email, this.password, this.role).then((ok: any) => {
      if (ok) {
      // redirect to role dashboard
      if (this.role === 'admin') this.router.navigate(['/admin']);
      else if (this.role === 'doctor') this.router.navigate(['/doctor']);
      else if (this.role === 'patient') this.router.navigate(['/patient']);
      else this.router.navigate(['/employee']);
    } else {
      this.error = 'Invalid credentials for selected role.';
    }
    }).catch(() => { this.error = 'Invalid credentials for selected role.'; });
  }
}
