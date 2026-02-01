// guards/pin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const pinGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userType = authService.getUserType();
  
  if (userType !== 'employee') {
    router.navigate(['/admin']);
    return false;
  }

  if (!authService.isEmployeeLocked()) {
    router.navigate(['/employee/dashboard']);
    return false;
  }

  return true;
};