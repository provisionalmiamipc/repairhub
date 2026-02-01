// guards/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que previene el acceso de usuarios autenticados a rutas de guest (login, register, etc.)
 * Si el usuario ya está autenticado Y no está bloqueado, lo redirige al dashboard
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está autenticado
  if (authService.isLoggedIn()) {
    const userType = authService.getUserType();
    
    // Si es empleado y está bloqueado, permitir acceso a login (para poder hacer logout)
    if (userType === 'employee' && authService.isEmployeeLocked()) {
      // Redirigir a verify-pin en lugar de permitir login
      router.navigate(['/verify-pin']);
      return false;
    }
    
    // Usuario autenticado y no bloqueado - redirigir al dashboard
    if (userType === 'employee') {
      router.navigate(['/employee/dashboard']);
    } else {
      router.navigate(['/dashboard']);
    }
    return false;
  }

  // Permitir acceso a la ruta (usuario no autenticado)
  return true;
};
