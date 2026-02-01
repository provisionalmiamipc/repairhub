#!/bin/bash

# Restaurar app.routes.ts a valores originales

cd /home/alfego/Documentos/repairhubcoreui

echo "🔄 Restaurando app.routes.ts a valores originales..."

# Crear un archivo temporal con las rutas correctas
cat > /tmp/fix_routes.sed << 'EOF'
# Notifications - cambiar de -modern a -page
s/notifications-list-modern\.component'/notifications-list-page.component'/g
s/NotificationsListModernComponent/NotificationsListPageComponent/g
s/notifications-form-modern\.component'/notifications-edit-page.component'/g
s/NotificationsFormModernComponent/NotificationsEditPageComponent/g

# Appointments - cambiar de -modern a versión simple
s/appointments-list-modern\.component'/appointments-list.component'/g
s/AppointmentsListModernComponent/AppointmentsListComponent/g
s/appointments-form-modern\.component'/appointments-edit.component'/g
s/AppointmentsFormModernComponent/AppointmentsEditComponent/g

# Centers
s/centers-list-modern\.component'/centers-list-page.component'/g
s/CentersListModernComponent/CentersListPageComponent/g
s/centers-form-modern\.component'/centers-edit-page.component'/g
s/CentersFormModernComponent/CentersEditPageComponent/g

# Customers - cambiar de -modern a -page
s/customers-list-modern\.component'/customers-list-page.component'/g
s/CustomersListModernComponent/CustomersListPageComponent/g
s/customers-form-modern\.component'/customers-edit-page.component'/g
s/CustomersFormModernComponent/CustomersEditPageComponent/g

# Device Brands
s/device-brands-list-modern\.component'/device-brands-list-page.component'/g
s/DeviceBrandsListModernComponent/DeviceBrandsListPageComponent/g
s/device-brands-form-modern\.component'/device-brands-edit-page.component'/g
s/DeviceBrandsFormModernComponent/DeviceBrandsEditPageComponent/g

# Devices
s/devices-list-modern\.component'/devices-list-page.component'/g
s/DevicesListModernComponent/DevicesListPageComponent/g
s/devices-form-modern\.component'/devices-edit-page.component'/g
s/DevicesFormModernComponent/DevicesEditPageComponent/g

# Inventory Movements
s/inventory-movements-list-modern\.component'/inventory-movements-list-page.component'/g
s/InventoryMovementsListModernComponent/InventoryMovementsListPageComponent/g
s/inventory-movements-form-modern\.component'/inventory-movements-edit-page.component'/g
s/InventoryMovementsFormModernComponent/InventoryMovementsEditPageComponent/g

# Item Types
s/item-types-list-modern\.component'/item-types-list-page.component'/g
s/ItemTypesListModernComponent/ItemTypesListPageComponent/g
s/item-types-form-modern\.component'/item-types-edit-page.component'/g
s/ItemTypesFormModernComponent/ItemTypesEditPageComponent/g

# Items
s/items-list-modern\.component'/items-list-page.component'/g
s/ItemsListModernComponent/ItemsListPageComponent/g
s/items-form-modern\.component'/items-edit-page.component'/g
s/ItemsFormModernComponent/ItemsEditPageComponent/g

# Orders
s/orders-list-modern\.component'/orders-list-page.component'/g
s/OrdersListModernComponent/OrdersListPageComponent/g
s/orders-form-modern\.component'/orders-edit-page.component'/g
s/OrdersFormModernComponent/OrdersEditPageComponent/g

# Payment Types
s/payment-types-list-modern\.component'/payment-types-list-page.component'/g
s/PaymentTypesListModernComponent/PaymentTypesListPageComponent/g
s/payment-types-form-modern\.component'/payment-types-edit-page.component'/g
s/PaymentTypesFormModernComponent/PaymentTypesEditPageComponent/g

# Repair Status
s/repair-status-list-modern\.component'/repair-status-list-page.component'/g
s/RepairStatusListModernComponent/RepairStatusListPageComponent/g
s/repair-status-form-modern\.component'/repair-status-edit-page.component'/g
s/RepairStatusFormModernComponent/RepairStatusEditPageComponent/g

# Service Orders
s/service-orders-list-modern\.component'/service-orders-list-page.component'/g
s/ServiceOrdersListModernComponent/ServiceOrdersListPageComponent/g
s/service-orders-form-modern\.component'/service-orders-edit-page.component'/g
s/ServiceOrdersFormModernComponent/ServiceOrdersEditPageComponent/g

# Stores
s/stores-list-modern\.component'/stores-list-page.component'/g
s/StoresListModernComponent/StoresListPageComponent/g
s/stores-form-modern\.component'/stores-edit-page.component'/g
s/StoresFormModernComponent/StoresEditPageComponent/g
EOF

sed -i -f /tmp/fix_routes.sed src/app/app.routes.ts

echo "✅ app.routes.ts restaurado"
