import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Auth } from '../auth/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: Auth, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const required = route.data && (route.data['role'] as string);
    // wait for Auth to initialize Firebase auth state (if used)
    if ((this.auth as any).ready && typeof (this.auth as any).ready.then === 'function') {
      try {
        await (this.auth as any).ready;
      } catch {
        // ignore
      }
    }
    const user = this.auth.currentUser;
    if (!required) return true; // no role required
    if (user && user.role === required) return true;
    // allow admin secret even if no user object (handled on login)
    this.router.navigate(['/login']);
    return false;
  }
}
