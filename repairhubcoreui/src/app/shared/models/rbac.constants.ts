/**
 * Sistema RBAC (Role-Based Access Control)
 * Define los tipos de roles y permisos del sistema
 */

// Tipos de roles del sistema
export enum UserType {
  USER = 'user',        // Administrador del sistema
  EMPLOYEE = 'employee' // Empleado con tipos específicos
}

// Tipos de empleados (sub-roles) - Basado en roles.constants.ts
export enum EmployeeType {
  EXPERT = 'Expert',
  ACCOUNTANT = 'Accountant',
  ADMIN_STORE = 'AdminStore'
}

// Acciones/permisos disponibles
export enum Permission {
  // Usuarios
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',

  // Centros
  VIEW_CENTERS = 'view_centers',
  CREATE_CENTER = 'create_center',
  EDIT_CENTER = 'edit_center',
  DELETE_CENTER = 'delete_center',

  // Tiendas
  VIEW_STORES = 'view_stores',
  CREATE_STORE = 'create_store',
  EDIT_STORE = 'edit_store',
  DELETE_STORE = 'delete_store',

  // Empleados
  VIEW_EMPLOYEES = 'view_employees',
  CREATE_EMPLOYEE = 'create_employee',
  EDIT_EMPLOYEE = 'edit_employee',
  DELETE_EMPLOYEE = 'delete_employee',

  // Clientes
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMER = 'create_customer',
  EDIT_CUSTOMER = 'edit_customer',
  DELETE_CUSTOMER = 'delete_customer',

  // Órdenes
  VIEW_ORDERS = 'view_orders',
  CREATE_ORDER = 'create_order',
  EDIT_ORDER = 'edit_order',
  DELETE_ORDER = 'delete_order',

  // Órdenes de Servicio
  VIEW_SERVICE_ORDERS = 'view_service_orders',
  CREATE_SERVICE_ORDER = 'create_service_order',
  EDIT_SERVICE_ORDER = 'edit_service_order',
  DELETE_SERVICE_ORDER = 'delete_service_order',

  // Ventas
  VIEW_SALES = 'view_sales',
  CREATE_SALE = 'create_sale',
  EDIT_SALE = 'edit_sale',
  DELETE_SALE = 'delete_sale',

  // Inventario
  VIEW_INVENTORY = 'view_inventory',
  EDIT_INVENTORY = 'edit_inventory',

  // Reportes
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',

  // Citas
  VIEW_APPOINTMENTS = 'view_appointments',
  CREATE_APPOINTMENT = 'create_appointment',
  EDIT_APPOINTMENT = 'edit_appointment',
  DELETE_APPOINTMENT = 'delete_appointment'
}

/**
 * Matriz de Permisos por Rol
 * Define qué permisos tiene cada rol
 */

// USER: Administrador del sistema - Acceso total  
const USER_PERMISSIONS: Permission[] = [
  // Usuarios
  Permission.VIEW_USERS,
  Permission.CREATE_USER,
  Permission.EDIT_USER,
  Permission.DELETE_USER,

  // Centros
  Permission.VIEW_CENTERS,
  Permission.CREATE_CENTER,
  Permission.EDIT_CENTER,
  Permission.DELETE_CENTER,

  // Tiendas
  Permission.VIEW_STORES,
  Permission.CREATE_STORE,
  Permission.EDIT_STORE,
  Permission.DELETE_STORE,

  // Empleados
  Permission.VIEW_EMPLOYEES,
  Permission.CREATE_EMPLOYEE,
  Permission.EDIT_EMPLOYEE,
  Permission.DELETE_EMPLOYEE,

  // Clientes
  Permission.VIEW_CUSTOMERS,
  Permission.CREATE_CUSTOMER,
  Permission.EDIT_CUSTOMER,
  Permission.DELETE_CUSTOMER,

  // Órdenes
  Permission.VIEW_ORDERS,
  Permission.CREATE_ORDER,
  Permission.EDIT_ORDER,
  Permission.DELETE_ORDER,

  // Órdenes de Servicio
  Permission.VIEW_SERVICE_ORDERS,
  Permission.CREATE_SERVICE_ORDER,
  Permission.EDIT_SERVICE_ORDER,
  Permission.DELETE_SERVICE_ORDER,

  // Ventas
  Permission.VIEW_SALES,
  Permission.CREATE_SALE,
  Permission.EDIT_SALE,
  Permission.DELETE_SALE,

  // Inventario
  Permission.VIEW_INVENTORY,
  Permission.EDIT_INVENTORY,

  // Reportes
  Permission.VIEW_REPORTS,
  Permission.EXPORT_REPORTS,

  // Citas
  Permission.VIEW_APPOINTMENTS,
  Permission.CREATE_APPOINTMENT,
  Permission.EDIT_APPOINTMENT,
  Permission.DELETE_APPOINTMENT
];

// EXPERT: Empleado base - Acceso limitado
const EXPERT_PERMISSIONS: Permission[] = [
  // Clientes (crear y ver propios)
  //Permission.VIEW_CUSTOMERS,
  //Permission.CREATE_CUSTOMER,

  // Órdenes de Servicio (asignadas a él)
  Permission.VIEW_SERVICE_ORDERS,
  Permission.CREATE_SERVICE_ORDER,

  // Citas
  Permission.VIEW_APPOINTMENTS,
  Permission.CREATE_APPOINTMENT
];

// ACCOUNTANT: Contador - Acceso a datos financieros
const ACCOUNTANT_PERMISSIONS: Permission[] = [
  // Órdenes (lectura)
  Permission.VIEW_ORDERS,
  Permission.EDIT_ORDER,  // Solo cambiar estado

  // Ventas (lectura)
  Permission.VIEW_SALES,
  Permission.EDIT_SALE,   // Solo cambiar estado

  // Reportes (acceso completo)
  Permission.VIEW_REPORTS,
  Permission.EXPORT_REPORTS
];

// ADMIN_STORE: Admin de tienda - Acceso completo a su tienda
const ADMIN_STORE_PERMISSIONS: Permission[] = [
  // Empleados de la tienda
  Permission.VIEW_EMPLOYEES,
  Permission.CREATE_EMPLOYEE,
  Permission.EDIT_EMPLOYEE,

  // Clientes de la tienda
  Permission.VIEW_CUSTOMERS,
  Permission.CREATE_CUSTOMER,
  Permission.EDIT_CUSTOMER,

  // Órdenes de la tienda
  Permission.VIEW_ORDERS,
  Permission.CREATE_ORDER,
  Permission.EDIT_ORDER,

  // Órdenes de Servicio de la tienda
  Permission.VIEW_SERVICE_ORDERS,
  Permission.CREATE_SERVICE_ORDER,
  Permission.EDIT_SERVICE_ORDER,

  // Ventas de la tienda
  Permission.VIEW_SALES,
  Permission.CREATE_SALE,
  Permission.EDIT_SALE,

  // Inventario de la tienda
  Permission.VIEW_INVENTORY,
  Permission.EDIT_INVENTORY,

  // Citas de la tienda
  Permission.VIEW_APPOINTMENTS,
  Permission.CREATE_APPOINTMENT,
  Permission.EDIT_APPOINTMENT
];

/**
 * Permisos adicionales para Center Admin (isCenterAdmin = true)
 * Estos permisos se suman al employee_type base del empleado
 */
export const CENTER_ADMIN_PERMISSIONS: Permission[] = [
  // Tiendas del centro
  Permission.VIEW_STORES,
  Permission.CREATE_STORE,
  Permission.EDIT_STORE,
  Permission.DELETE_STORE,

  // Empleados del centro
  Permission.VIEW_EMPLOYEES,
  Permission.CREATE_EMPLOYEE,
  Permission.EDIT_EMPLOYEE,
  Permission.DELETE_EMPLOYEE,

  // Clientes del centro
  Permission.VIEW_CUSTOMERS,
  Permission.CREATE_CUSTOMER,
  Permission.EDIT_CUSTOMER,
  Permission.DELETE_CUSTOMER,

  // Órdenes del centro
  Permission.VIEW_ORDERS,
  Permission.CREATE_ORDER,
  Permission.EDIT_ORDER,
  Permission.DELETE_ORDER,

  // Órdenes de Servicio del centro
  Permission.VIEW_SERVICE_ORDERS,
  Permission.CREATE_SERVICE_ORDER,
  Permission.EDIT_SERVICE_ORDER,
  Permission.DELETE_SERVICE_ORDER,

  // Ventas del centro
  Permission.VIEW_SALES,
  Permission.CREATE_SALE,
  Permission.EDIT_SALE,
  Permission.DELETE_SALE,

  // Inventario del centro
  Permission.VIEW_INVENTORY,
  Permission.EDIT_INVENTORY,

  // Reportes del centro
  Permission.VIEW_REPORTS,
  Permission.EXPORT_REPORTS,

  // Citas del centro
  Permission.VIEW_APPOINTMENTS,
  Permission.CREATE_APPOINTMENT,
  Permission.EDIT_APPOINTMENT,
  Permission.DELETE_APPOINTMENT
];

export const ROLE_PERMISSIONS: Record<UserType | EmployeeType, Permission[]> = {
  [UserType.USER]: USER_PERMISSIONS,
  [UserType.EMPLOYEE]: [], // Rol base de empleado sin permisos específicos
  [EmployeeType.EXPERT]: EXPERT_PERMISSIONS,
  [EmployeeType.ACCOUNTANT]: ACCOUNTANT_PERMISSIONS,
  [EmployeeType.ADMIN_STORE]: ADMIN_STORE_PERMISSIONS
};

/**
 * Obtener el rol efectivo de un usuario
 * Un empleado tiene un rol base (EMPLOYEE) + tipo específico
 */
export function getEffectiveRole(
  userType: UserType,
  employeeType?: EmployeeType
): UserType | EmployeeType {
  if (userType === UserType.USER) {
    return UserType.USER;
  }
  return employeeType || EmployeeType.EXPERT;
}

/**
 * Obtener todos los permisos de un usuario
 */
export function getUserPermissions(
  userType: UserType,
  employeeType?: EmployeeType,
  isCenterAdmin?: boolean
): Permission[] {
  if (userType === UserType.USER) {
    return ROLE_PERMISSIONS[UserType.USER];
  }

  const effectiveRole = employeeType || EmployeeType.EXPERT;
  let permissions = ROLE_PERMISSIONS[effectiveRole] || [];
  
  // Si es Center Admin, agregar permisos adicionales
  if (isCenterAdmin) {
    permissions = [...permissions, ...CENTER_ADMIN_PERMISSIONS];
  }
  
  return permissions;
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function hasPermission(
  userType: UserType,
  employeeType: EmployeeType | undefined,
  requiredPermission: Permission,
  isCenterAdmin?: boolean
): boolean {
  const permissions = getUserPermissions(userType, employeeType, isCenterAdmin);
  return permissions.includes(requiredPermission);
}
