// guards/employee-role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard que permite restringir rutas a tipos de employee específicos.
 * Uso: en la ruta añadir `canActivate: [employeeRoleGuard]` y
 * `data: { allowedEmployeeTypes: ['AdminStore','Accountant'] }`.
 */
export const employeeRoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No autenticado -> login
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Sólo aplicable a employees
  const userType = authService.getUserType();
  if (userType !== 'employee') {
    router.navigate(['/unauthorized']);
    return false;
  }

  // Si no se especifican roles permitidos, permitimos (comportamiento permissive)
  const allowed: string[] = route.data?.['allowedEmployeeTypes'] || route.data?.['allowedRoles'] || [];
  if (!allowed || allowed.length === 0) {
    return true;
  }

  const currentRole = authService.getCurrentEmployeeRole();
  if (!currentRole) {
    router.navigate(['/unauthorized']);
    return false;
  }

  // Comparación exacta (case-sensitive según nuestros EmployeeType strings)
  if (!allowed.includes(currentRole)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
