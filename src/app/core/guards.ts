import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models';
import { Store } from './store';

/** Signed-in users only; with roles given, only those roles (others go to their dashboard). */
export const allow = (...roles: Role[]): CanActivateFn => () => {
  const me = inject(Store).me();
  const router = inject(Router);
  if (!me) return router.parseUrl('/login');
  return !roles.length || roles.includes(me.role) ? true : router.parseUrl('/app');
};

/** Login/register pages bounce signed-in users to the app. */
export const guestOnly: CanActivateFn = () =>
  inject(Store).me() ? inject(Router).parseUrl('/app') : true;
