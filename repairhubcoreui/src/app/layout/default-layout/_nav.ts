import { INavData } from '@coreui/angular';
import { UserType, EmployeeType } from '../../shared/models/rbac.constants';

/**
 * Extended interface to support role-based visibility
 * Los roles permitidos son UserType | EmployeeType | null (para todos)
 */
interface NavItemWithRoles extends INavData {
  roles?: (UserType | EmployeeType)[] | null; // null = visible para todos
  children?: NavItemWithRoles[];
}

export const navItems: NavItemWithRoles[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    /*badge: {
      color: 'info',
      text: 'NEW'
    },*/
    roles: null // visible para todos
  },
  {
    title: true,
    name: 'Main'
  },
  {
    name: 'Centers',
    url: '/centers',
    //iconComponent: { name: 'cil-institution' },
    icon: 'bi bi-bank',
    roles: [UserType.USER] // solo para super admin
  },
  {
    name: 'Stores',
    url: '/stores',
    iconComponent: { name: 'cilBuilding' },
    roles: [UserType.USER] // super admin y center admin (verificado por isCenterAdmin)
  },
  {
    name: 'Employees',
    url: '/employees',
    linkProps: { fragment: 'headings' },
    iconComponent: { name: 'cil-group' },
    roles: [UserType.USER, EmployeeType.ADMIN_STORE] // admin, center admin (verificado por isCenterAdmin), store admin
  },
  {
    name: 'Store',
    title: true
  },
  
  {
    name: 'Appointments',
    url: '/appointments',
    iconComponent: { name: 'cil-cursor' },
    roles: null // visible para todos
  },
  {
    name: 'Services Order',
    url: '/service-orders',
    iconComponent: { name: 'cil-notes' },
    roles: null // visible para todos
  },
  
  {
    name: 'Customers',
    iconComponent: { name: 'cil-star' },
    url: '/customers',
    roles: null // visible para todos
  },
  {
    name: 'Items',
    url: '/items',
    iconComponent: { name: 'cil-puzzle' },
    roles: null // visible para todos
  },
  {
    name: 'Notifications',
    url: '/notification',
    iconComponent: { name: 'cil-bell' },
    roles: null // visible para todos
  },  
  {
    title: true,
    name: 'Extras'
  },
  {
    name: 'Config',
    url: '/login',    
    icon: 'bi bi-gear',
    roles: [UserType.USER], // solo para super admin
    children: [
      {
        name: 'Devices',
        url: '/devices',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Brands',
        url: '/device-brands',
        icon: 'nav-icon-bullet'
      },{
        name: 'Services Type ',
        url: '/service-types',
        icon: 'nav-icon-bullet'
      },

      
    ]
  },
  
];
