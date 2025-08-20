
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
import { Injector } from '@angular/core';
import { NotificationService } from '../../core/notification.service';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private auth: Auth, private router: Router, private injector: Injector) {}

  onLogin() {
    this.error = '';
    this.auth.login(this.email, this.password, this.role).then((ok: any) => {
      const toastr = this.injector.get(ToastrService, null as any);
      if (ok) {
        // push both Toastr (if available) and our NotificationService so UI always shows a toast
        const ns = this.injector.get(NotificationService, null as any);
        if (toastr && typeof toastr.success === 'function') {
          toastr.success('Welcome back!', 'Signed in');
        }
        if (ns) ns.success('Welcome back!', 'Signed in');
      // redirect to role dashboard
      if (this.role === 'admin') this.router.navigate(['/admin']);
      else if (this.role === 'doctor') this.router.navigate(['/doctor']);
      else if (this.role === 'patient') this.router.navigate(['/patient']);
      else this.router.navigate(['/employee']);
    } else {
      this.error = 'Invalid credentials for selected role.';
      const ns = this.injector.get(NotificationService, null as any);
      if (toastr && typeof toastr.error === 'function') {
        toastr.error('Invalid email/password or role.', 'Login failed');
      }
      if (ns) {
        ns.error('Invalid email/password or role.', 'Login failed');
        ns.showBanner('Login failed: invalid credentials for selected role.', 4000);
      }
    }
    }).catch(() => {
      this.error = 'Invalid credentials for selected role.';
      const toastr = this.injector.get(ToastrService, null as any);
      const ns = this.injector.get(NotificationService, null as any);
      if (toastr && typeof toastr.error === 'function') {
        toastr.error('Invalid email/password or role.', 'Login failed');
      }
      if (ns) {
        ns.error('Invalid email/password or role.', 'Login failed');
        ns.showBanner('Login failed: invalid credentials for selected role.', 4000);
      }
    });
  }
}
