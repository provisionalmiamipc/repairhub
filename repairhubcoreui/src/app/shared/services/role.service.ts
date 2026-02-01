// services/role.service.ts
import { Injectable } from '@angular/core';
import { EmployeeRole, EmployeeType, RolePermissions } from '../models/constants/roles.constants';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private rolePermissions: Map<EmployeeType, RolePermissions> = new Map([
    ['Expert', {
      canViewFinancial: false,
      canManageInventory: false,
      canManageEmployees: false,
      canViewReports: false,
      canManageStore: false
    }],
    ['Accountant', {
      canViewFinancial: true,
      canManageInventory: false,
      canManageEmployees: false,
      canViewReports: true,
      canManageStore: false
    }],
    ['AdminStore', {
      canViewFinancial: true,
      canManageInventory: true,
      canManageEmployees: true,
      canViewReports: true,
      canManageStore: true
    }]
  ]);

  getPermissions(role: EmployeeType): RolePermissions {
    return this.rolePermissions.get(role) || this.rolePermissions.get('Expert')!;
  }

  hasPermission(role: EmployeeType, permission: keyof RolePermissions): boolean {
    const permissions = this.getPermissions(role);
    return permissions[permission];
  }

  getRoleHierarchy(role: EmployeeType): number {
    const hierarchy = {
      'Expert': 1,
      'Accountant': 2,
      'AdminStore': 3
    };
    return hierarchy[role];
  }

  canAccessModule(role: EmployeeType, module: string): boolean {
    const modulePermissions = {
      'financial': this.hasPermission(role, 'canViewFinancial'),
      'inventory': this.hasPermission(role, 'canManageInventory'),
      'employees': this.hasPermission(role, 'canManageEmployees'),
      'reports': this.hasPermission(role, 'canViewReports'),
      'store-management': this.hasPermission(role, 'canManageStore')
    };

    return modulePermissions[module as keyof typeof modulePermissions] || false;
  }

  getRoleDisplayName(role: EmployeeType): string {
    const roleNames = {
      'Expert': 'Expert',
      'Accountant': 'Accountant',
      'AdminStore': 'Store Administrator'
    };
    return roleNames[role];
  }

  // Método para convertir string a EmployeeType de forma segura
  parseRole(role: string): EmployeeType {
    if (this.isEmployeeRole(role)) {
      return role;
    }
    return 'Expert'; // valor por defecto
  }

  private isEmployeeRole(role: string): role is EmployeeType {
    return role === 'Expert' || role === 'Accountant' || role === 'AdminStore';
  }
}