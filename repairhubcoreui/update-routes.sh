#!/bin/bash

# Script para actualizar las rutas en app.routes.ts a los componentes modernos

CRUDS=(
  "notifications:notifications-list-page:notifications-list-modern:NotificationsListPageComponent:NotificationsListModernComponent"
  "notifications:notifications-edit-page:notifications-form-modern:NotificationsEditPageComponent:NotificationsFormModernComponent"
  "appointments:appointments-list:appointments-list-modern:AppointmentsListComponent:AppointmentsListModernComponent"
  "appointments:appointments-edit:appointments-form-modern:AppointmentsEditComponent:AppointmentsFormModernComponent"
  "appointments:appointments-detail:appointments-detail-page:AppointmentsDetailComponent:AppointmentsDetailPageComponent"
  "centers:centers-list-page:centers-list-modern:CentersListPageComponent:CentersListModernComponent"
  "centers:centers-edit-page:centers-form-modern:CentersEditPageComponent:CentersFormModernComponent"
  "customers:customers-list:customers-list-modern:CustomersListComponent:CustomersListModernComponent"
  "customers:customers-edit:customers-form-modern:CustomersEditComponent:CustomersFormModernComponent"
  "customers:customers-detail:customers-detail-page:CustomersDetailComponent:CustomersDetailPageComponent"
  "device-brands:device-brands-list-page:device-brands-list-modern:DeviceBrandsListPageComponent:DeviceBrandsListModernComponent"
  "device-brands:device-brands-edit-page:device-brands-form-modern:DeviceBrandsEditPageComponent:DeviceBrandsFormModernComponent"
  "orders:orders-list-page:orders-list-modern:OrdersListPageComponent:OrdersListModernComponent"
  "orders:orders-edit-page:orders-form-modern:OrdersEditPageComponent:OrdersFormModernComponent"
  "items:items-list-page:items-list-modern:ItemsListPageComponent:ItemsListModernComponent"
  "items:items-edit-page:items-form-modern:ItemsEditPageComponent:ItemsFormModernComponent"
  "inventory-movements:inventory-movements-list-page:inventory-movements-list-modern:InventoryMovementsListPageComponent:InventoryMovementsListModernComponent"
  "inventory-movements:inventory-movements-edit-page:inventory-movements-form-modern:InventoryMovementsEditPageComponent:InventoryMovementsFormModernComponent"
  "item-types:item-types-list-page:item-types-list-modern:ItemTypesListPageComponent:ItemTypesListModernComponent"
  "item-types:item-types-edit-page:item-types-form-modern:ItemTypesEditPageComponent:ItemTypesFormModernComponent"
  "payment-types:payment-types-list-page:payment-types-list-modern:PaymentTypesListPageComponent:PaymentTypesListModernComponent"
  "payment-types:payment-types-edit-page:payment-types-form-modern:PaymentTypesEditPageComponent:PaymentTypesFormModernComponent"
  "repair-status:repair-status-list-page:repair-status-list-modern:RepairStatusListPageComponent:RepairStatusListModernComponent"
  "repair-status:repair-status-edit-page:repair-status-form-modern:RepairStatusEditPageComponent:RepairStatusFormModernComponent"
  "service-orders:service-orders-list-page:service-orders-list-modern:ServiceOrdersListPageComponent:ServiceOrdersListModernComponent"
  "service-orders:service-orders-edit-page:service-orders-form-modern:ServiceOrdersEditPageComponent:ServiceOrdersFormModernComponent"
  "stores:stores-list-page:stores-list-modern:StoresListPageComponent:StoresListModernComponent"
  "stores:stores-edit-page:stores-form-modern:StoresEditPageComponent:StoresFormModernComponent"
  "devices:devices-list-page:devices-list-modern:DevicesListPageComponent:DevicesListModernComponent"
  "devices:devices-edit-page:devices-form-modern:DevicesEditPageComponent:DevicesFormModernComponent"
)

FILE="/home/alfego/Documentos/repairhubcoreui/src/app/app.routes.ts"

echo "🔄 Actualizando rutas en app.routes.ts..."

for CRUD in "${CRUDS[@]}"; do
  IFS=':' read -r FEATURE OLD_NAME NEW_NAME OLD_CLASS NEW_CLASS <<< "$CRUD"
  
  # Reemplazar en el archivo
  sed -i "s|'./features/${FEATURE}/${OLD_NAME}.component'|'./features/${FEATURE}/${NEW_NAME}.component'|g" "$FILE"
  sed -i "s|then(m => m.${OLD_CLASS})|then(m => m.${NEW_CLASS})|g" "$FILE"
  
  echo "✅ ${FEATURE}: ${OLD_NAME} → ${NEW_NAME}"
done

echo ""
echo "✅ Todas las rutas han sido actualizadas"

