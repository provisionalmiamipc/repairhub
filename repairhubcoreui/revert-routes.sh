#!/bin/bash

# Script para revertir las rutas a las originales antes del update-routes.sh

cd /home/alfego/Documentos/repairhubcoreui

echo "🔄 Revirtiendo rutas a componentes originales..."

# Notifications: -list-modern → -list-page | -form-modern → -edit-page  
sed -i "s|notifications-list-modern\.component'|notifications-list-page.component'|g" src/app/app.routes.ts
sed -i "s|NotificationsListModernComponent|NotificationsListPageComponent|g" src/app/app.routes.ts
sed -i "s|notifications-form-modern\.component'|notifications-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|NotificationsFormModernComponent|NotificationsEditPageComponent|g" src/app/app.routes.ts

# Appointments: -list-modern → -list | -form-modern → -edit
sed -i "s|appointments-list-modern\.component'|appointments-list.component'|g" src/app/app.routes.ts
sed -i "s|AppointmentsListModernComponent|AppointmentsListComponent|g" src/app/app.routes.ts
sed -i "s|appointments-form-modern\.component'|appointments-edit.component'|g" src/app/app.routes.ts
sed -i "s|AppointmentsFormModernComponent|AppointmentsEditComponent|g" src/app/app.routes.ts

# Centers: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|centers-list-modern\.component'|centers-list-page.component'|g" src/app/app.routes.ts
sed -i "s|CentersListModernComponent|CentersListPageComponent|g" src/app/app.routes.ts
sed -i "s|centers-form-modern\.component'|centers-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|CentersFormModernComponent|CentersEditPageComponent|g" src/app/app.routes.ts

# Customers: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|customers-list-modern\.component'|customers-list-page.component'|g" src/app/app.routes.ts
sed -i "s|CustomersListModernComponent|CustomersListPageComponent|g" src/app/app.routes.ts
sed -i "s|customers-form-modern\.component'|customers-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|CustomersFormModernComponent|CustomersEditPageComponent|g" src/app/app.routes.ts

# Device Brands: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|device-brands-list-modern\.component'|device-brands-list-page.component'|g" src/app/app.routes.ts
sed -i "s|DeviceBrandsListModernComponent|DeviceBrandsListPageComponent|g" src/app/app.routes.ts
sed -i "s|device-brands-form-modern\.component'|device-brands-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|DeviceBrandsFormModernComponent|DeviceBrandsEditPageComponent|g" src/app/app.routes.ts

# Orders: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|orders-list-modern\.component'|orders-list-page.component'|g" src/app/app.routes.ts
sed -i "s|OrdersListModernComponent|OrdersListPageComponent|g" src/app/app.routes.ts
sed -i "s|orders-form-modern\.component'|orders-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|OrdersFormModernComponent|OrdersEditPageComponent|g" src/app/app.routes.ts

# Items: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|items-list-modern\.component'|items-list-page.component'|g" src/app/app.routes.ts
sed -i "s|ItemsListModernComponent|ItemsListPageComponent|g" src/app/app.routes.ts
sed -i "s|items-form-modern\.component'|items-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|ItemsFormModernComponent|ItemsEditPageComponent|g" src/app/app.routes.ts

# Inventory Movements: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|inventory-movements-list-modern\.component'|inventory-movements-list-page.component'|g" src/app/app.routes.ts
sed -i "s|InventoryMovementsListModernComponent|InventoryMovementsListPageComponent|g" src/app/app.routes.ts
sed -i "s|inventory-movements-form-modern\.component'|inventory-movements-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|InventoryMovementsFormModernComponent|InventoryMovementsEditPageComponent|g" src/app/app.routes.ts

# Item Types: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|item-types-list-modern\.component'|item-types-list-page.component'|g" src/app/app.routes.ts
sed -i "s|ItemTypesListModernComponent|ItemTypesListPageComponent|g" src/app/app.routes.ts
sed -i "s|item-types-form-modern\.component'|item-types-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|ItemTypesFormModernComponent|ItemTypesEditPageComponent|g" src/app/app.routes.ts

# Payment Types: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|payment-types-list-modern\.component'|payment-types-list-page.component'|g" src/app/app.routes.ts
sed -i "s|PaymentTypesListModernComponent|PaymentTypesListPageComponent|g" src/app/app.routes.ts
sed -i "s|payment-types-form-modern\.component'|payment-types-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|PaymentTypesFormModernComponent|PaymentTypesEditPageComponent|g" src/app/app.routes.ts

# Repair Status: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|repair-status-list-modern\.component'|repair-status-list-page.component'|g" src/app/app.routes.ts
sed -i "s|RepairStatusListModernComponent|RepairStatusListPageComponent|g" src/app/app.routes.ts
sed -i "s|repair-status-form-modern\.component'|repair-status-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|RepairStatusFormModernComponent|RepairStatusEditPageComponent|g" src/app/app.routes.ts

# Service Orders: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|service-orders-list-modern\.component'|service-orders-list-page.component'|g" src/app/app.routes.ts
sed -i "s|ServiceOrdersListModernComponent|ServiceOrdersListPageComponent|g" src/app/app.routes.ts
sed -i "s|service-orders-form-modern\.component'|service-orders-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|ServiceOrdersFormModernComponent|ServiceOrdersEditPageComponent|g" src/app/app.routes.ts

# Stores: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|stores-list-modern\.component'|stores-list-page.component'|g" src/app/app.routes.ts
sed -i "s|StoresListModernComponent|StoresListPageComponent|g" src/app/app.routes.ts
sed -i "s|stores-form-modern\.component'|stores-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|StoresFormModernComponent|StoresEditPageComponent|g" src/app/app.routes.ts

# Devices: -list-modern → -list-page | -form-modern → -edit-page
sed -i "s|devices-list-modern\.component'|devices-list-page.component'|g" src/app/app.routes.ts
sed -i "s|DevicesListModernComponent|DevicesListPageComponent|g" src/app/app.routes.ts
sed -i "s|devices-form-modern\.component'|devices-edit-page.component'|g" src/app/app.routes.ts
sed -i "s|DevicesFormModernComponent|DevicesEditPageComponent|g" src/app/app.routes.ts

echo "✅ Rutas revertidas correctamente"
