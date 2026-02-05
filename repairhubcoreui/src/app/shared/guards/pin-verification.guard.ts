import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * PIN Verification Guard
 * 
 * Protects routes para empleados que requieren:
 * 1. Verificación PIN en esta sesión (post-login)
 * 2. O desbloqueo con PIN si la sesión está bloqueada por inactividad
 * 
 * Usuarios normales (userType: 'user') no requieren PIN y pueden acceder libremente.
 * 
 * Flujo:
 * - Si no es empleado → permitir acceso
 * - Si es empleado pero está bloqueado → redirigir a /verify-pin
 * - Si es empleado pero no ha verificado PIN en esta sesión → redirigir a /verify-pin
 * - Si es empleado y ha verificado PIN → permitir acceso
 */
export const pinVerificationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userType = authService.getUserType();
  
  // Usuarios normales (tipo 'user') no requieren PIN
  if (userType !== 'employee') {
    return true;
  }

  // Empleados siempre deben ir al dashboard de empleados
  if (state.url.startsWith('/dashboard')) {
    router.navigate(['/employee/dashboard']);
    return false;
  }

  // Empleado bloqueado por inactividad → requiere PIN para desbloquear
  if (authService.isEmployeeLocked()) {
    // Capturar la URL actual del navegador (incluyendo query params)
    const currentUrl = window.location.pathname + window.location.search;
    console.log('Employee locked, saving returnUrl:', currentUrl);
    authService.setReturnUrl(currentUrl);
    router.navigate(['/verify-pin']);
    return false;
  }

  // Empleado sin verificación PIN en esta sesión → mostrar PIN modal
  if (!authService.isPinVerified()) {
    // Capturar la URL actual del navegador (incluyendo query params)
    const currentUrl = window.location.pathname + window.location.search;
    console.log('PIN not verified, saving returnUrl:', currentUrl);
    authService.setReturnUrl(currentUrl);
    router.navigate(['/verify-pin']);
    return false;
  }

  // Empleado con PIN verificado → permitir acceso
  return true;
};
