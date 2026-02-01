import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionsService } from '../services/permissions.service';
import { AuthService } from '../services/auth.service';
import { EmployeeType, Permission } from '../models/rbac.constants';

/**
 * Guard: Solo para Users (Administradores del Sistema)
 * Uso: { path: 'system-admin', canActivate: [userGuard] }
 */
export const userGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  if (permissionsService.isAdmin()) {
    return true;
  }

  console.warn('Access denied: User (Admin) role required');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Para CenterAdmin o USER (super admin)
 * Acceso completo a datos del centro
 */
export const centerAdminGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // USER (super admin) tiene acceso a todo
  if (permissionsService.isAdmin()) {
    return true;
  }

  const employee = authService.getCurrentEmployee();

  if (employee?.isCenterAdmin) {
    return true;
  }

  console.warn('Access denied: CenterAdmin role required');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Para AdminStore o USER (super admin)
 * Acceso completo a datos de su tienda
 */
export const storeAdminGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  // USER (super admin) tiene acceso a todo
  if (permissionsService.isAdmin()) {
    return true;
  }

  const employeeType = permissionsService.getEmployeeType();

  if (employeeType === EmployeeType.ADMIN_STORE) {
    return true;
  }

  console.warn('Access denied: AdminStore role required');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Para Admin de Centro, Tienda o USER (super admin)
 * Uso: { path: 'manage-location', canActivate: [employeeAdminGuard] }
 */
export const employeeAdminGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  // USER (super admin) tiene acceso a todo
  if (permissionsService.isAdmin()) {
    return true;
  }

  if (permissionsService.isEmployeeAdmin()) {
    return true;
  }

  console.warn('Access denied: Employee Admin role required');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Para Contador o USER (super admin)
 * Acceso a datos financieros
 */
export const accountantGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  // USER (super admin) tiene acceso a todo
  if (permissionsService.isAdmin()) {
    return true;
  }

  if (permissionsService.isAccountant()) {
    return true;
  }

  console.warn('Access denied: Accountant role required');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Basado en Permiso Específico
 * Uso: { path: 'create-order', canActivate: [permissionGuard], data: { requiredPermission: Permission.CREATE_ORDER } }
 */
export const permissionGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const requiredPermission = route.data?.['requiredPermission'] as Permission;

  if (!requiredPermission) {
    console.warn('Guard error: requiredPermission not defined in route data');
    return true; // Si no hay permiso requerido, permitir
  }

  if (permissionsService.hasPermission(requiredPermission)) {
    return true;
  }

  console.warn(`Access denied: ${requiredPermission} permission required`);
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Múltiples Permisos (Cualquiera)
 * Uso: { path: 'create-data', canActivate: [anyPermissionGuard], data: { requiredPermissions: [Permission.CREATE_ORDER, Permission.CREATE_SALE] } }
 */
export const anyPermissionGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const requiredPermissions = route.data?.['requiredPermissions'] as Permission[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (permissionsService.hasAnyPermission(requiredPermissions)) {
    return true;
  }

  console.warn('Access denied: None of the required permissions granted');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Todos los Permisos
 * Uso: { path: 'admin-panel', canActivate: [allPermissionsGuard], data: { requiredPermissions: [Permission.EDIT_USER, Permission.DELETE_USER] } }
 */
export const allPermissionsGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const requiredPermissions = route.data?.['requiredPermissions'] as Permission[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (permissionsService.hasAllPermissions(requiredPermissions)) {
    return true;
  }

  console.warn('Access denied: Not all required permissions granted');
  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard: Acceso a Recurso Específico
 * Valida que el usuario tenga acceso al centro/tienda del recurso
 * Uso: { path: 'stores/:id/edit', canActivate: [resourceAccessGuard], data: { requiredPermission: Permission.EDIT_STORE } }
 */
export const resourceAccessGuard: CanActivateFn = (route) => {
  const permissionsService = inject(PermissionsService);
  const router = inject(Router);

  const requiredPermission = route.data?.['requiredPermission'] as Permission;
  const resourceCenterId = route.params?.['centerId'];
  const resourceStoreId = route.params?.['storeId'];

  // Verificar permiso base
  if (requiredPermission && !permissionsService.hasPermission(requiredPermission)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  // Verificar acceso al recurso (centro/tienda)
  if (!permissionsService.canAccessResource(resourceCenterId, resourceStoreId)) {
    console.warn('Access denied: User cannot access this resource location');
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
