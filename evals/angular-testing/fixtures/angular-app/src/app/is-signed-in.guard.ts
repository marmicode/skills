import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';

export const isSignedInGuard: CanActivateFn = () => {
  if (inject(Auth).isSignedIn()) return true;
  return inject(Router).createUrlTree(['search']);
};
