// guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';
import { EmployeeType, RolePermissions } from '../models/constants/roles.constants';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const roleService = inject(RoleService);
  const router = inject(Router);

  const userType = authService.getUserType();
  
  if (userType !== 'employee') {
    router.navigate(['/unauthorized']);
    return false;
  }

  const employeeRole = authService.getCurrentEmployeeRole();
  if (!employeeRole) {
    router.navigate(['/unauthorized']);
    return false;
  }

  const requiredPermissions = route.data?.['permissions'] as (keyof RolePermissions)[];
  const requiredRole = route.data?.['requiredRole'] as EmployeeType;

  if (requiredRole) {
    const currentRoleLevel = roleService.getRoleHierarchy(employeeRole);
    const requiredRoleLevel = roleService.getRoleHierarchy(requiredRole);
    
    if (currentRoleLevel < requiredRoleLevel) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      authService.hasEmployeePermission(permission)
    );

    if (!hasAllPermissions) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  return true;
};