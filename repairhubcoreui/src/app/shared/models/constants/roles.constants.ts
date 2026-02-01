// constants/roles.constants.ts
export enum EmployeeRole {
  EXPERT = 'Expert',
  ACCOUNTANT = 'Accountant',
  ADMIN_STORE = 'AdminStore'
}

export type EmployeeType = 
  | 'Expert' 
  | 'Accountant' 
  | 'AdminStore';

export interface RolePermissions {
  canViewFinancial: boolean;
  canManageInventory: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
  canManageStore: boolean;
}

// Función helper para verificar roles
export function isEmployeeRole(role: string): role is EmployeeType {
  return role === 'Expert' || role === 'Accountant' || role === 'AdminStore';
}