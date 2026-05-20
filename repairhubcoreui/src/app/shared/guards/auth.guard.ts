// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    authService.setReturnUrl(state.url);
    router.navigate(['/login']);
    return false;
  }

  const userType = authService.getUserType();
  const expectedUserType = route.data?.['userType'];

  if (expectedUserType && userType !== expectedUserType) {
    router.navigate(['/unauthorized']);
    return false;
  }

  if (userType === 'employee' && authService.isEmployeeLocked()) {
    authService.setReturnUrl(state.url);
    router.navigate(['/verify-pin']);
    return false;
  }

  return true;
};
