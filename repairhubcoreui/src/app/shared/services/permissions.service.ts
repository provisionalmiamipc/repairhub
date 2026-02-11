import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import {
  UserType,
  EmployeeType,
  Permission,
  ROLE_PERMISSIONS,
  getEffectiveRole,
  getUserPermissions,
  hasPermission as checkPermission
} from '../models/rbac.constants';

/**
 * PermissionsService
 * Maneja la lógica de verificación de permisos
 * Sincronizado con AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  private roleSubject = new BehaviorSubject<UserType | EmployeeType | null>(null);
  public role$ = this.roleSubject.asObservable();

  constructor(private authService: AuthService) {
    // Sincronizar permisos con cambios de autenticación
    // Observar tanto employee$ como user$ del AuthService
    combineLatest([
      this.authService.employee$,
      this.authService.user$
    ]).subscribe(([employee, user]) => {
      if (employee) {
        // Es un empleado
        const employeeType = employee.employee_type as EmployeeType;
        const permissions = getUserPermissions(UserType.EMPLOYEE, employeeType, employee.isCenterAdmin);
        this.permissionsSubject.next(permissions);

        const role = getEffectiveRole(UserType.EMPLOYEE, employeeType);
        this.roleSubject.next(role);
      } else if (user) {
        // Es un usuario (admin sistema)
        const permissions = getUserPermissions(UserType.USER, undefined);
        this.permissionsSubject.next(permissions);

        const role = getEffectiveRole(UserType.USER, undefined);
        this.roleSubject.next(role);
      } else {
        this.permissionsSubject.next([]);
        this.roleSubject.next(null);
      }
    });
  }

  /**
   * Obtener todos los permisos actuales
   */
  getPermissions(): Permission[] {
    return this.permissionsSubject.value;
  }

  /**
   * Obtener el rol efectivo actual
   */
  getRole(): UserType | EmployeeType | null {
    return this.roleSubject.value;
  }

  /**
   * Verificar si el usuario actual tiene un permiso específico
   */
  hasPermission(permission: Permission): boolean {
    const employee = this.authService.getCurrentEmployee();
    const userType = this.authService.getUserType();

    if (employee) {
      // Include `isCenterAdmin` flag so center admins inherit additional permissions
      return checkPermission(
        UserType.EMPLOYEE,
        employee.employee_type as EmployeeType,
        permission,
        employee.isCenterAdmin
      );
    } else if (userType === 'user') {
      return checkPermission(UserType.USER, undefined, permission);
    }

    return false;
  }

  /**
   * Verificar si el usuario tiene ALGUNO de los permisos
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Verificar si el usuario tiene TODOS los permisos
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Obtener permisos para un rol específico
   */
  getPermissionsForRole(role: UserType | EmployeeType): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Verificar si el usuario es admin (USER)
   */
  isAdmin(): boolean {
    return this.authService.getUserType() === 'user';
  }

  /**
   * Verificar si el usuario es employee admin (CenterAdmin o AdminStore)
   */
  isEmployeeAdmin(): boolean {
    const employee = this.authService.getCurrentEmployee();
    if (!employee) return false;

    const empType = employee.employee_type as string;
    return employee.isCenterAdmin || empType === 'AdminStore';
  }

  /**
   * Verificar si el usuario es contador
   */
  isAccountant(): boolean {
    const employee = this.authService.getCurrentEmployee();
    if (!employee) return false;

    const empType = employee.employee_type as string;
    return empType === 'Accountant';
  }

  /**
   * Obtener tipo de empleado
   */
  getEmployeeType(): EmployeeType | null {
    const employee = this.authService.getCurrentEmployee();
    return (employee?.employee_type as EmployeeType) || null;
  }

  /**
   * Verificar si el usuario tiene acceso a un recurso específico
   * Esto valida que el recurso pertenezca al centro/tienda del usuario
   */
  canAccessResource(
    resourceCenterId?: number,
    resourceStoreId?: number
  ): boolean {
    const employee = this.authService.getCurrentEmployee();
    const userType = this.authService.getUserType();

    // USER (admin sistema) tiene acceso a todo
    if (userType === 'user') {
      return true;
    }

    if (!employee) return false;

    const empType = employee.employee_type as string;

    // Center Admin tiene acceso a su centro
    if (employee.isCenterAdmin) {
      return resourceCenterId === employee.centerId;
    }

    // ADMIN_STORE tiene acceso a su tienda
    if (empType === 'AdminStore') {
      return resourceStoreId === employee.storeId;
    }

    // Otros tienen acceso a su centro
    return resourceCenterId === employee.centerId;
  }

  /**
   * Verificar si el usuario puede crear en una ubicación
   */
  canCreateInLocation(centerId?: number, storeId?: number): boolean {
    return this.canAccessResource(centerId, storeId);
  }

  /**
   * Obtener el ID del centro del usuario actual
   */
  getCenterId(): number | null {
    return this.authService.getCenterId();
  }

  /**
   * Obtener el ID de la tienda del usuario actual
   */
  getStoreId(): number | null {
    return this.authService.getStoreId();
  }
}
