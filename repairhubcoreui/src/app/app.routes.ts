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
  permissionGuard,
  allPermissionsGuard
} from './shared/rbac';
import { Permission } from './shared/rbac';

export const routes: Routes = [
  {
    path: 'activate',
    loadComponent: () => import('./views/pages/activate/activate.component').then(m => m.ActivateComponent),
    data: { title: 'Activar cuenta' }
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
      { 
      path: 'received-parts', loadComponent: () => import('./features/received-parts/received-parts-list.component').then(m => m.ReceivedPartsListComponent),
      canActivate: [authGuard]
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
    canActivate: [authGuard, pinVerificationGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
        canActivate: [authGuard, pinVerificationGuard]
      },
      {
        path: 'employee/dashboard',
        loadComponent: () => import('./features/employee-dashboard/employee-dashboard.component').then(m => m.EmployeeDashboardComponent),
        canActivate: [authGuard, pinVerificationGuard, roleGuard]
      },
      {
        path: 'theme',
        loadChildren: () => import('./views/theme/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'base',
        loadChildren: () => import('./views/base/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'buttons',
        loadChildren: () => import('./views/buttons/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'forms',
        loadChildren: () => import('./views/forms/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'icons',
        loadChildren: () => import('./views/icons/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'notifications',
        loadChildren: () => import('./views/notifications/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'widgets',
        loadChildren: () => import('./views/widgets/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'charts',
        loadChildren: () => import('./views/charts/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      {
        path: 'pages',
        loadChildren: () => import('./views/pages/routes').then((m) => m.routes),
        canActivate: [authGuard]
      },
      { path: 'users', loadComponent: () => import('./features/users/users-list-page.component').then(m => m.UsersListPageComponent), canActivate: [authGuard, userGuard]},
      { path: 'users/new', loadComponent: () => import('./features/users/users-form-page.component').then(m => m.UsersFormPageComponent), canActivate: [authGuard, userGuard] },
      { path: 'users/:id', loadComponent: () => import('./features/users/users-detail-page.component').then(m => m.UsersDetailPageComponent), canActivate: [authGuard, userGuard] },
      { path: 'users/:id/edit', loadComponent: () => import('./features/users/users-edit-page.component').then(m => m.UsersEditPageComponent), canActivate: [authGuard, userGuard] },

      { path: 'so-notes', loadComponent: () => import('./features/so-notes/so-notes-list-page.component').then(m => m.SONotesListPageComponent), canActivate: [authGuard] },
      { path: 'so-notes/new', loadComponent: () => import('./features/so-notes/so-notes-form.component').then(m => m.SONotesFormComponent), canActivate: [authGuard] },
      { path: 'so-notes/:id', loadComponent: () => import('./features/so-notes/so-notes-detail-page.component').then(m => m.SONotesDetailPageComponent), canActivate: [authGuard] },
      { path: 'so-notes/:id/edit', loadComponent: () => import('./features/so-notes/so-notes-edit-page.component').then(m => m.SONotesEditPageComponent), canActivate: [authGuard] },

      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications-list-page.component').then(m => m.NotificationsListPageComponent), canActivate: [authGuard] },
      { path: 'notifications/new', loadComponent: () => import('./features/notifications/notifications-edit-page.component').then(m => m.NotificationsEditPageComponent), canActivate: [authGuard] },
      { path: 'notifications/:id', loadComponent: () => import('./features/notifications/notifications-detail-page.component').then(m => m.NotificationsDetailPageComponent), canActivate: [authGuard] },
      { path: 'notifications/:id/edit', loadComponent: () => import('./features/notifications/notifications-edit-page.component').then(m => m.NotificationsEditPageComponent), canActivate: [authGuard] },

      { path: 'appointments', loadComponent: () => import('./features/appointments/appointments-list-modern.component').then(m => m.AppointmentsListModernComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'appointments/new', loadComponent: () => import('./features/appointments/appointments-form-modern.component').then(m => m.AppointmentsFormModernComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'appointments/:id', loadComponent: () => import('./features/appointments/appointments-detail.component').then(m => m.AppointmentsDetailComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'appointments/:id/edit', loadComponent: () => import('./features/appointments/appointments-form-modern.component').then(m => m.AppointmentsFormModernComponent), canActivate: [authGuard, centerAdminGuard] },

      { path: 'centers', loadComponent: () => import('./features/centers/centers-list-modern.component').then(m => m.CentersListModernComponent), data:{title: 'Centers'}, canActivate: [authGuard, userGuard] },
      { path: 'centers/new', loadComponent: () => import('./features/centers/centers-form-modern.component').then(m => m.CentersFormModernComponent), canActivate: [authGuard, userGuard] },
      { path: 'centers/:id', loadComponent: () => import('./features/centers/centers-detail-page.component').then(m => m.CentersDetailPageComponent), canActivate: [authGuard, userGuard] },
      { path: 'centers/:id/edit', loadComponent: () => import('./features/centers/centers-form-modern.component').then(m => m.CentersFormModernComponent), canActivate: [authGuard, userGuard] },

      { path: 'customers', loadComponent: () => import('./features/customers/customers-list-modern.component').then(m => m.CustomersListModernComponent), canActivate: [authGuard] },
      { path: 'customers/new', loadComponent: () => import('./features/customers/customers-form-modern.component').then(m => m.CustomersFormModernComponent), canActivate: [authGuard] },
      { path: 'customers/:id', loadComponent: () => import('./features/customers/customers-detail.component').then(m => m.CustomersDetailComponent), canActivate: [authGuard] },
      { path: 'customers/:id/edit', loadComponent: () => import('./features/customers/customers-form-modern.component').then(m => m.CustomersFormModernComponent), canActivate: [authGuard] },

      { path: 'device-brands', loadComponent: () => import('./features/device-brands/device-brands-list-modern.component').then(m => m.DeviceBrandsListModernComponent), canActivate: [authGuard] },
      { path: 'device-brands/new', loadComponent: () => import('./features/device-brands/device-brands-form-modern.component').then(m => m.DeviceBrandsFormModernComponent), canActivate: [authGuard] },
      { path: 'device-brands/:id', loadComponent: () => import('./features/device-brands/device-brands-detail-page.component').then(m => m.DeviceBrandsDetailPageComponent), canActivate: [authGuard] },
      { path: 'device-brands/:id/edit', loadComponent: () => import('./features/device-brands/device-brands-form-modern.component').then(m => m.DeviceBrandsFormModernComponent), canActivate: [authGuard] },

      { path: 'employees', loadComponent: () => import('./features/employees/employees-list-modern.component').then(m => m.EmployeesListModernComponent), canActivate: [authGuard, employeeAdminGuard] },
      { path: 'employees/new', loadComponent: () => import('./features/employees/employees-form-modern.component').then(m => m.EmployeesFormModernComponent), canActivate: [authGuard, employeeAdminGuard] },
      { path: 'employees/:id', loadComponent: () => import('./features/employees/employees-detail.component').then(m => m.EmployeesDetailComponent), canActivate: [authGuard, employeeAdminGuard] },
      { path: 'employees/:id/edit', loadComponent: () => import('./features/employees/employees-form-modern.component').then(m => m.EmployeesFormModernComponent), canActivate: [authGuard, employeeAdminGuard] },

      { path: 'orders', loadComponent: () => import('./features/orders/orders-list-modern.component').then(m => m.OrdersListModernComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'orders/new', loadComponent: () => import('./features/orders/orders-form-modern.component').then(m => m.OrdersFormModernComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'orders/:id', loadComponent: () => import('./features/orders/orders-detail-page.component').then(m => m.OrdersDetailPageComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'orders/:id/edit', loadComponent: () => import('./features/orders/orders-form-modern.component').then(m => m.OrdersFormModernComponent), canActivate: [authGuard, accountantGuard] },

      { path: 'orders-item', loadComponent: () => import('./features/orders-item/orders-item-list-page.component').then(m => m.OrdersItemListPageComponent), canActivate: [authGuard] },
      { path: 'orders-item/new', loadComponent: () => import('./features/orders-item/orders-item-edit-page.component').then(m => m.OrdersItemEditPageComponent), canActivate: [authGuard] },
      { path: 'orders-item/:id', loadComponent: () => import('./features/orders-item/orders-item-detail-page.component').then(m => m.OrdersItemDetailPageComponent), canActivate: [authGuard] },
      { path: 'orders-item/:id/edit', loadComponent: () => import('./features/orders-item/orders-item-edit-page.component').then(m => m.OrdersItemEditPageComponent), canActivate: [authGuard] },

      { path: 'sales', loadComponent: () => import('./features/sales/sales-list-modern.component').then(m => m.SalesListModernComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'sales/new', loadComponent: () => import('./features/sales/sales-form-modern.component').then(m => m.SalesFormModernComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'sales/:id', loadComponent: () => import('./features/sales/sales-detail-page.component').then(m => m.SalesDetailPageComponent), canActivate: [authGuard, accountantGuard] },
      { path: 'sales/:id/edit', loadComponent: () => import('./features/sales/sales-form-modern.component').then(m => m.SalesFormModernComponent), canActivate: [authGuard, accountantGuard] },

      { path: 'sale-items', loadComponent: () => import('./features/sale-items/sale-items-list-modern.component').then(m => m.SaleItemsListModernComponent), canActivate: [authGuard] },
      { path: 'sale-items/new', loadComponent: () => import('./features/sale-items/sale-items-form-modern.component').then(m => m.SaleItemsFormModernComponent), canActivate: [authGuard] },
      { path: 'sale-items/:id', loadComponent: () => import('./features/sale-items/sale-items-detail-page.component').then(m => m.SaleItemsDetailPageComponent), canActivate: [authGuard] },
      { path: 'sale-items/:id/edit', loadComponent: () => import('./features/sale-items/sale-items-form-modern.component').then(m => m.SaleItemsFormModernComponent), canActivate: [authGuard] },

      { path: 'items', loadComponent: () => import('./features/items/items-list-modern.component').then(m => m.ItemsListModernComponent), canActivate: [authGuard] },
      { path: 'items/new', loadComponent: () => import('./features/items/items-form-modern.component').then(m => m.ItemsFormModernComponent), canActivate: [authGuard] },
      { path: 'items/:id', loadComponent: () => import('./features/items/items-detail-page.component').then(m => m.ItemsDetailPageComponent), canActivate: [authGuard] },
      { path: 'items/:id/edit', loadComponent: () => import('./features/items/items-form-modern.component').then(m => m.ItemsFormModernComponent), canActivate: [authGuard] },

      { path: 'inventory-movements', loadComponent: () => import('./features/inventory-movements/inventory-movements-list-page.component').then(m => m.InventoryMovementsListPageComponent), canActivate: [authGuard] },
      { path: 'inventory-movements/new', loadComponent: () => import('./features/inventory-movements/inventory-movements-edit-page.component').then(m => m.InventoryMovementsEditPageComponent), canActivate: [authGuard] },
      { path: 'inventory-movements/:id', loadComponent: () => import('./features/inventory-movements/inventory-movements-detail-page.component').then(m => m.InventoryMovementsDetailPageComponent), canActivate: [authGuard] },
      { path: 'inventory-movements/:id/edit', loadComponent: () => import('./features/inventory-movements/inventory-movements-edit-page.component').then(m => m.InventoryMovementsEditPageComponent), canActivate: [authGuard] },

      { path: 'service-order-requeste', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-list-page.component').then(m => m.ServiceOrderRequesteListPageComponent), canActivate: [authGuard] },
      { path: 'service-order-requeste/new', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-edit-page.component').then(m => m.ServiceOrderRequesteEditPageComponent), canActivate: [authGuard] },
      { path: 'service-order-requeste/:id', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-detail-page.component').then(m => m.ServiceOrderRequesteDetailPageComponent), canActivate: [authGuard] },
      { path: 'service-order-requeste/:id/edit', loadComponent: () => import('./features/service-order-requeste/service-order-requeste-edit-page.component').then(m => m.ServiceOrderRequesteEditPageComponent), canActivate: [authGuard] },

      { path: 'item-types', loadComponent: () => import('./features/item-types/item-types-list-page.component').then(m => m.ItemTypesListPageComponent), canActivate: [authGuard] },
      { path: 'item-types/new', loadComponent: () => import('./features/item-types/item-types-edit-page.component').then(m => m.ItemTypesEditPageComponent), canActivate: [authGuard] },
      { path: 'item-types/:id', loadComponent: () => import('./features/item-types/item-types-detail-page.component').then(m => m.ItemTypesDetailPageComponent), canActivate: [authGuard] },
      { path: 'item-types/:id/edit', loadComponent: () => import('./features/item-types/item-types-edit-page.component').then(m => m.ItemTypesEditPageComponent), canActivate: [authGuard] },

      { path: 'service-types', loadComponent: () => import('./features/service-types/service-types-list-page.component').then(m => m.ServiceTypesListPageComponent), canActivate: [authGuard] },
      { path: 'service-types/new', loadComponent: () => import('./features/service-types/service-types-edit-page.component').then(m => m.ServiceTypesEditPageComponent), canActivate: [authGuard] },
      { path: 'service-types/:id', loadComponent: () => import('./features/service-types/service-types-detail-page.component').then(m => m.ServiceTypesDetailPageComponent), canActivate: [authGuard] },
      { path: 'service-types/:id/edit', loadComponent: () => import('./features/service-types/service-types-edit-page.component').then(m => m.ServiceTypesEditPageComponent), canActivate: [authGuard] },

      { path: 'so-items', loadComponent: () => import('./features/so-items/so-items-list-page.component').then(m => m.SOItemsListPageComponent), canActivate: [authGuard] },
      { path: 'so-items/new', loadComponent: () => import('./features/so-items/so-items-edit-page.component').then(m => m.SOItemsEditPageComponent), canActivate: [authGuard] },
      { path: 'so-items/:id', loadComponent: () => import('./features/so-items/so-items-detail-page.component').then(m => m.SOItemsDetailPageComponent), canActivate: [authGuard] },
      { path: 'so-items/:id/edit', loadComponent: () => import('./features/so-items/so-items-edit-page.component').then(m => m.SOItemsEditPageComponent), canActivate: [authGuard] },

      { path: 'payment-types', loadComponent: () => import('./features/payment-types/payment-types-list-page.component').then(m => m.PaymentTypesListPageComponent), canActivate: [authGuard] },
      { path: 'payment-types/new', loadComponent: () => import('./features/payment-types/payment-types-edit-page.component').then(m => m.PaymentTypesEditPageComponent), canActivate: [authGuard] },
      { path: 'payment-types/:id', loadComponent: () => import('./features/payment-types/payment-types-detail-page.component').then(m => m.PaymentTypesDetailPageComponent), canActivate: [authGuard] },
      { path: 'payment-types/:id/edit', loadComponent: () => import('./features/payment-types/payment-types-edit-page.component').then(m => m.PaymentTypesEditPageComponent), canActivate: [authGuard] },

      { path: 'repair-status', loadComponent: () => import('./features/repair-status/repair-status-list-page.component').then(m => m.RepairStatusListPageComponent), canActivate: [authGuard] },
      { path: 'repair-status/new', loadComponent: () => import('./features/repair-status/repair-status-edit-page.component').then(m => m.RepairStatusEditPageComponent), canActivate: [authGuard] },
      { path: 'repair-status/:id', loadComponent: () => import('./features/repair-status/repair-status-detail-page.component').then(m => m.RepairStatusDetailPageComponent), canActivate: [authGuard] },
      { path: 'repair-status/:id/edit', loadComponent: () => import('./features/repair-status/repair-status-edit-page.component').then(m => m.RepairStatusEditPageComponent), canActivate: [authGuard] },

      { path: 'so-diagnostic', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-list-page.component').then(m => m.SODiagnosticListPageComponent), canActivate: [authGuard] },
      { path: 'so-diagnostic/new', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-form.component').then(m => m.SODiagnosticFormComponent), canActivate: [authGuard] },
      { path: 'so-diagnostic/:id', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-detail-page.component').then(m => m.SODiagnosticDetailPageComponent), canActivate: [authGuard] },
      { path: 'so-diagnostic/:id/edit', loadComponent: () => import('./features/so-diagnostic/so-diagnostic-edit-page.component').then(m => m.SODiagnosticEditPageComponent), canActivate: [authGuard] },

      // Para service-orders
      { path: 'service-orders', loadComponent: () => import('./features/service-orders/service-orders-list-modern.component').then(m => m.ServiceOrdersListModernComponent), canActivate: [authGuard] },
      { path: 'service-orders/new', loadComponent: () => import('./features/service-orders/service-orders-form-modern.component').then(m => m.ServiceOrdersFormModernComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'service-orders/:id', loadComponent: () => import('./features/service-orders/service-orders-detail-page.component').then(m => m.ServiceOrdersDetailPageComponent), canActivate: [authGuard] },
      { path: 'service-orders/:id/edit', loadComponent: () => import('./features/service-orders/service-orders-form-modern.component').then(m => m.ServiceOrdersFormModernComponent), canActivate: [authGuard] },

      { path: 'stores', loadComponent: () => import('./features/stores/stores-list-modern.component').then(m => m.StoresListModernComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'stores/new', loadComponent: () => import('./features/stores/stores-form-modern.component').then(m => m.StoresFormModernComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'stores/:id', loadComponent: () => import('./features/stores/stores-detail-page.component').then(m => m.StoresDetailPageComponent), canActivate: [authGuard, centerAdminGuard] },
      { path: 'stores/:id/edit', loadComponent: () => import('./features/stores/stores-form-modern.component').then(m => m.StoresFormModernComponent), canActivate: [authGuard, centerAdminGuard] },

      // Para devices
      { path: 'devices', loadComponent: () => import('./features/devices/devices-list-modern.component').then(m => m.DevicesListModernComponent), canActivate: [authGuard] },
      { path: 'devices/new', loadComponent: () => import('./features/devices/devices-form-modern.component').then(m => m.DevicesFormModernComponent), canActivate: [authGuard] },
      { path: 'devices/:id', loadComponent: () => import('./features/devices/devices-detail-page.component').then(m => m.DevicesDetailPageComponent), canActivate: [authGuard] },
      { path: 'devices/:id/edit', loadComponent: () => import('./features/devices/devices-form-modern.component').then(m => m.DevicesFormModernComponent), canActivate: [authGuard] },
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
    path: 'activate',
    loadComponent: () => import('./views/pages/activate/activate.component').then(m => m.ActivateComponent),
    data: { title: 'Activar cuenta' }
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
