import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { guestGuard } from './shared/guards/guest.guard';
import { verifyPinAccessGuard } from './shared/guards/verify-pin-access.guard';
import { pinGuard } from './shared/guards/pin.guard';
import { pinVerificationGuard } from './shared/guards/pin-verification.guard';
import { roleGuard } from './shared/guards/role.guard';
import {
  userGuard,
  employeeAdminGuard,
  accountantGuard,
  centerAdminGuard,
  storeAdminGuard,
  permissionGuard,
  allPermissionsGuard
} from './shared/rbac';
import { Permission } from './shared/rbac';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  { 
    path: 'login', 
    loadComponent: () => import('./shared/components/login/login.component').then(c => c.LoginComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'verify-pin', 
    loadComponent: () => import('./shared/components/verify-pin-page/verify-pin-page.component').then(c => c.VerifyPinPageComponent),
    canActivate: [verifyPinAccessGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layout').then(m => m.DefaultLayoutComponent),
    data: {
      title: 'Home'
    },
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
        canActivate: [pinVerificationGuard]
      },
      {
        path: 'employee/dashboard',
        loadComponent: () => import('./features/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent),
        canActivate: [pinVerificationGuard, roleGuard]
      },
      {
        path: 'theme',
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes)
      },
      {
        path: 'base',
        loadChildren: () => import('./views/base/routes').then((m) => m.routes)
      },
      {
        path: 'buttons',
        loadChildren: () => import('./views/buttons/routes').then((m) => m.routes)
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/forms/routes').then((m) => m.routes)
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes)
      },
      {
        path: 'notifications',
        loadChildren: () => import('./views/notifications/routes').then((m) => m.routes)
      },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes)
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes)
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes)
      },
      { path: 'users', loadComponent: () => import('./features/users/users-list-page.component').then(m => m.UsersListPageComponent), canActivate: [userGuard]},
      { path: 'users/new', loadComponent: () => import('./features/users/users-form.component').then(m => m.UsersFormComponent), canActivate: [userGuard] },
      { path: 'users/:id', loadComponent: () => import('./features/users/users-detail-page.component').then(m => m.UsersDetailPageComponent), canActivate: [userGuard] },
      { path: 'users/:id/edit', loadComponent: () => import('./features/users/users-edit-page.component').then(m => m.UsersEditPageComponent), canActivate: [userGuard] },

      { path: 'so-notes', loadComponent: () => import('./features/so-notes/so-notes-list-page.component').then(m => m.SONotesListPageComponent) },
      { path: 'so-notes/new', loadComponent: () => import('./features/so-notes/so-notes-form.component').then(m => m.SONotesFormComponent) },
      { path: 'so-notes/:id', loadComponent: () => import('./features/so-notes/so-notes-detail-page.component').then(m => m.SONotesDetailPageComponent) },
      { path: 'so-notes/:id/edit', loadComponent: () => import('./features/so-notes/so-notes-edit-page.component').then(m => m.SONotesEditPageComponent) },

      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications-list-page.component').then(m => m.NotificationsListPageComponent) },
      { path: 'notifications/new', loadComponent: () => import('./features/notifications/notifications-edit-page.component').then(m => m.NotificationsEditPageComponent) },
      { path: 'notifications/:id', loadComponent: () => import('./features/notifications/notifications-detail-page.component').then(m => m.NotificationsDetailPageComponent) },
      { path: 'notifications/:id/edit', loadComponent: () => import('./features/notifications/notifications-edit-page.component').then(m => m.NotificationsEditPageComponent) },

      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments-list-modern.component').then(m => m.AppointmentsListModernComponent) },
      { path: 'appointments/new', loadComponent: () => import('./features/appointments/appointments-form-modern.component').then(m => m.AppointmentsFormModernComponent) },
      { path: 'appointments/:id', loadComponent: () => import('./features/appointments/appointments-detail.component').then(m => m.AppointmentsDetailComponent) },
      { path: 'appointments/:id/edit', loadComponent: () => import('./features/appointments/appointments-form-modern.component').then(m => m.AppointmentsFormModernComponent) },

      { path: 'centers', loadComponent: () => import('./features/centers/centers-list-modern.component').then(m => m.CentersListModernComponent), data:{title: 'Centers'}, canActivate: [userGuard] },
      { path: 'centers/new', loadComponent: () => import('./features/centers/centers-form-modern.component').then(m => m.CentersFormModernComponent), canActivate: [userGuard] },
      { path: 'centers/:id', loadComponent: () => import('./features/centers/centers-detail-page.component').then(m => m.CentersDetailPageComponent), canActivate: [userGuard] },
      { path: 'centers/:id/edit', loadComponent: () => import('./features/centers/centers-form-modern.component').then(m => m.CentersFormModernComponent), canActivate: [userGuard] },

      { path: 'customers', loadComponent: () => import('./features/customers/customers-list-modern.component').then(m => m.CustomersListModernComponent) },
      { path: 'customers/new', loadComponent: () => import('./features/customers/customers-form-modern.component').then(m => m.CustomersFormModernComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/customers/customers-detail.component').then(m => m.CustomersDetailComponent) },
      { path: 'customers/:id/edit', loadComponent: () => import('./features/customers/customers-form-modern.component').then(m => m.CustomersFormModernComponent) },

      { path: 'device-brands', loadComponent: () => import('./features/device-brands/device-brands-list-modern.component').then(m => m.DeviceBrandsListModernComponent) },
      { path: 'device-brands/new', loadComponent: () => import('./features/device-brands/device-brands-form-modern.component').then(m => m.DeviceBrandsFormModernComponent) },
      { path: 'device-brands/:id', loadComponent: () => import('./features/device-brands/device-brands-detail-page.component').then(m => m.DeviceBrandsDetailPageComponent) },
      { path: 'device-brands/:id/edit', loadComponent: () => import('./features/device-brands/device-brands-form-modern.component').then(m => m.DeviceBrandsFormModernComponent) },

      { path: 'employees', loadComponent: () => import('./features/employees/employees-list-modern.component').then(m => m.EmployeesListModernComponent), canActivate: [employeeAdminGuard] },
      { path: 'employees/new', loadComponent: () => import('./features/employees/employees-form-modern.component').then(m => m.EmployeesFormModernComponent), canActivate: [employeeAdminGuard] },
      { path: 'employees/:id', loadComponent: () => import('./features/employees/employees-detail.component').then(m => m.EmployeesDetailComponent), canActivate: [employeeAdminGuard] },
      { path: 'employees/:id/edit', loadComponent: () => import('./features/employees/employees-form-modern.component').then(m => m.EmployeesFormModernComponent), canActivate: [employeeAdminGuard] },

      { path: 'orders', loadComponent: () => import('./features/orders/orders-list-modern.component').then(m => m.OrdersListModernComponent), canActivate: [accountantGuard] },
      { path: 'orders/new', loadComponent: () => import('./features/orders/orders-form-modern.component').then(m => m.OrdersFormModernComponent), canActivate: [accountantGuard] },
      { path: 'orders/:id', loadComponent: () => import('./features/orders/orders-detail-page.component').then(m => m.OrdersDetailPageComponent), canActivate: [accountantGuard] },
      { path: 'orders/:id/edit', loadComponent: () => import('./features/orders/orders-form-modern.component').then(m => m.OrdersFormModernComponent), canActivate: [accountantGuard] },

      { path: 'orders-item', loadComponent: () => import('./features/orders-item/orders-item-list-page.component').then(m => m.OrdersItemListPageComponent) },
      { path: 'orders-item/new', loadComponent: () => import('./features/orders-item/orders-item-edit-page.component').then(m => m.OrdersItemEditPageComponent) },
      { path: 'orders-item/:id', loadComponent: () => import('./features/orders-item/orders-item-detail-page.component').then(m => m.OrdersItemDetailPageComponent) },
      { path: 'orders-item/:id/edit', loadComponent: () => import('./features/orders-item/orders-item-edit-page.component').then(m => m.OrdersItemEditPageComponent) },

      { path: 'sales', loadComponent: () => import('./features/sales/sales-list-modern.component').then(m => m.SalesListModernComponent), canActivate: [accountantGuard] },
      { path: 'sales/new', loadComponent: () => import('./features/sales/sales-form-modern.component').then(m => m.SalesFormModernComponent), canActivate: [accountantGuard] },
      { path: 'sales/:id', loadComponent: () => import('./features/sales/sales-detail-page.component').then(m => m.SalesDetailPageComponent), canActivate: [accountantGuard] },
      { path: 'sales/:id/edit', loadComponent: () => import('./features/sales/sales-form-modern.component').then(m => m.SalesFormModernComponent), canActivate: [accountantGuard] },

      { path: 'sale-items', loadComponent: () => import('./features/sale-items/sale-items-list-modern.component').then(m => m.SaleItemsListModernComponent) },
      { path: 'sale-items/new', loadComponent: () => import('./features/sale-items/sale-items-form-modern.component').then(m => m.SaleItemsFormModernComponent) },
      { path: 'sale-items/:id', loadComponent: () => import('./features/sale-items/sale-items-detail-page.component').then(m => m.SaleItemsDetailPageComponent) },
      { path: 'sale-items/:id/edit', loadComponent: () => import('./features/sale-items/sale-items-form-modern.component').then(m => m.SaleItemsFormModernComponent) },

      { path: 'items', loadComponent: () => import('./features/items/items-list-modern.component').then(m => m.ItemsListModernComponent) },
      { path: 'items/new', loadComponent: () => import('./features/items/items-form-modern.component').then(m => m.ItemsFormModernComponent) },
      { path: 'items/:id', loadComponent: () => import('./features/items/items-detail-page.component').then(m => m.ItemsDetailPageComponent) },
      { path: 'items/:id/edit', loadComponent: () => import('./features/items/items-form-modern.component').then(m => m.ItemsFormModernComponent) },

      { path: 'inventory-movements', loadComponent: () => import('./features/inventory-movements/inventory-movements-list-page.component').then(m => m.InventoryMovementsListPageComponent) },
      { path: 'inventory-movements/new', loadComponent: () => import('./features/inventory-movements/inventory-movements-edit-page.component').then(m => m.InventoryMovementsEditPageComponent) },
      { path: 'inventory-movements/:id', loadComponent: () => import('./features/inventory-movements/inventory-movements-detail-page.component').then(m => m.InventoryMovementsDetailPageComponent) },
      { path: 'inventory-movements/:id/edit', loadComponent: () => import('./features/inventory-movements/inventory-movements-edit-page.component').then(m => m.InventoryMovementsEditPageComponent) },

      { path: 'service-order-requeste', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-list-page.component').then(m => m.ServiceOrderRequesteListPageComponent) },
      { path: 'service-order-requeste/new', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-edit-page.component').then(m => m.ServiceOrderRequesteEditPageComponent) },
      { path: 'service-order-requeste/:id', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-detail-page.component').then(m => m.ServiceOrderRequesteDetailPageComponent) },
      { path: 'service-order-requeste/:id/edit', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-edit-page.component').then(m => m.ServiceOrderRequesteEditPageComponent) },

      { path: 'item-types', loadComponent: () => import('./features/item-types/item-types-list-page.component').then(m => m.ItemTypesListPageComponent) },
      { path: 'item-types/new', loadComponent: () => import('./features/item-types/item-types-edit-page.component').then(m => m.ItemTypesEditPageComponent) },
      { path: 'item-types/:id', loadComponent: () => import('./features/item-types/item-types-detail-page.component').then(m => m.ItemTypesDetailPageComponent) },
      { path: 'item-types/:id/edit', loadComponent: () => import('./features/item-types/item-types-edit-page.component').then(m => m.ItemTypesEditPageComponent) },

      { path: 'service-types', loadComponent: () => import('./features/service-types/service-types-list-page.component').then(m => m.ServiceTypesListPageComponent) },
      { path: 'service-types/new', loadComponent: () => import('./features/service-types/service-types-edit-page.component').then(m => m.ServiceTypesEditPageComponent) },
      { path: 'service-types/:id', loadComponent: () => import('./features/service-types/service-types-detail-page.component').then(m => m.ServiceTypesDetailPageComponent) },
      { path: 'service-types/:id/edit', loadComponent: () => import('./features/service-types/service-types-edit-page.component').then(m => m.ServiceTypesEditPageComponent) },

      { path: 'so-items', loadComponent: () => import('./features/so-items/so-items-list-page.component').then(m => m.SOItemsListPageComponent) },
      { path: 'so-items/new', loadComponent: () => import('./features/so-items/so-items-edit-page.component').then(m => m.SOItemsEditPageComponent) },
      { path: 'so-items/:id', loadComponent: () => import('./features/so-items/so-items-detail-page.component').then(m => m.SOItemsDetailPageComponent) },
      { path: 'so-items/:id/edit', loadComponent: () => import('./features/so-items/so-items-edit-page.component').then(m => m.SOItemsEditPageComponent) },

      { path: 'payment-types', loadComponent: () => import('./features/payment-types/payment-types-list-page.component').then(m => m.PaymentTypesListPageComponent) },
      { path: 'payment-types/new', loadComponent: () => import('./features/payment-types/payment-types-edit-page.component').then(m => m.PaymentTypesEditPageComponent) },
      { path: 'payment-types/:id', loadComponent: () => import('./features/payment-types/payment-types-detail-page.component').then(m => m.PaymentTypesDetailPageComponent) },
      { path: 'payment-types/:id/edit', loadComponent: () => import('./features/payment-types/payment-types-edit-page.component').then(m => m.PaymentTypesEditPageComponent) },

      { path: 'repair-status', loadComponent: () => import('./features/repair-status/repair-status-list-page.component').then(m => m.RepairStatusListPageComponent) },
      { path: 'repair-status/new', loadComponent: () => import('./features/repair-status/repair-status-edit-page.component').then(m => m.RepairStatusEditPageComponent) },
      { path: 'repair-status/:id', loadComponent: () => import('./features/repair-status/repair-status-detail-page.component').then(m => m.RepairStatusDetailPageComponent) },
      { path: 'repair-status/:id/edit', loadComponent: () => import('./features/repair-status/repair-status-edit-page.component').then(m => m.RepairStatusEditPageComponent) },

      { path: 'so-diagnostic', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-list-page.component').then(m => m.SODiagnosticListPageComponent) },
      { path: 'so-diagnostic/new', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-form.component').then(m => m.SODiagnosticFormComponent) },
      { path: 'so-diagnostic/:id', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-detail-page.component').then(m => m.SODiagnosticDetailPageComponent) },
      { path: 'so-diagnostic/:id/edit', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-edit-page.component').then(m => m.SODiagnosticEditPageComponent) },

      // Para service-orders
      { path: 'service-orders', loadComponent: () => import('./features/service-orders/service-orders-list-modern.component').then(m => m.ServiceOrdersListModernComponent), canActivate: [authGuard] },
      { path: 'service-orders/new', loadComponent: () => import('./features/service-orders/service-orders-form-modern.component').then(m => m.ServiceOrdersFormModernComponent), canActivate: [authGuard] },
      { path: 'service-orders/:id', loadComponent: () => import('./features/service-orders/service-orders-detail-page.component').then(m => m.ServiceOrdersDetailPageComponent), canActivate: [authGuard] },
      { path: 'service-orders/:id/edit', loadComponent: () => import('./features/service-orders/service-orders-form-modern.component').then(m => m.ServiceOrdersFormModernComponent), canActivate: [authGuard] },

      { path: 'stores', loadComponent: () => import('./features/stores/stores-list-modern.component').then(m => m.StoresListModernComponent), canActivate: [centerAdminGuard] },
      { path: 'stores/new', loadComponent: () => import('./features/stores/stores-form-modern.component').then(m => m.StoresFormModernComponent), canActivate: [centerAdminGuard] },
      { path: 'stores/:id', loadComponent: () => import('./features/stores/stores-detail-page.component').then(m => m.StoresDetailPageComponent), canActivate: [centerAdminGuard] },
      { path: 'stores/:id/edit', loadComponent: () => import('./features/stores/stores-form-modern.component').then(m => m.StoresFormModernComponent), canActivate: [centerAdminGuard] },

      // Para devices
      { path: 'devices', loadComponent: () => import('./features/devices/devices-list-modern.component').then(m => m.DevicesListModernComponent) },
      { path: 'devices/new', loadComponent: () => import('./features/devices/devices-form-modern.component').then(m => m.DevicesFormModernComponent) },
      { path: 'devices/:id', loadComponent: () => import('./features/devices/devices-detail-page.component').then(m => m.DevicesDetailPageComponent) },
      { path: 'devices/:id/edit', loadComponent: () => import('./features/devices/devices-form-modern.component').then(m => m.DevicesFormModernComponent) },
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
