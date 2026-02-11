// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isLoggedIn()) {
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
    router.navigate(['/verify-pin']);
    return false;
  }

  return true;
};