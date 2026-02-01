// guards/verify-pin-access.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para la ruta /verify-pin
 * Permite acceso solo si:
 * 1. El usuario está autenticado
 * 2. Es un empleado
 * 3. La sesión está bloqueada (locked) O el PIN no ha sido verificado
 */
export const verifyPinAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está autenticado, redirigir al login
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const userType = authService.getUserType();

  // Si no es empleado, redirigir al dashboard (usuarios no usan PIN)
  if (userType !== 'employee') {
    router.navigate(['/dashboard']);
    return false;
  }

  // Si el empleado está bloqueado O no ha verificado el PIN, permitir acceso
  if (authService.isEmployeeLocked() || !authService.isPinVerified()) {
    return true;
  }

  // Empleado con PIN verificado y no bloqueado - redirigir al dashboard
  router.navigate(['/employee/dashboard']);
  return false;
};
