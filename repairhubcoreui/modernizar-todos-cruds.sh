#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 MODERNIZACIÓN AUTOMÁTICA - TODOS LOS CRUDs (Versión Mejorada)
# ═══════════════════════════════════════════════════════════════════════════════

BASEDIR="/home/alfego/Documentos/repairhubcoreui"
TEMPLATE_DIR="$BASEDIR/src/app/features/employees"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Mapeo de CRUDs
CRUDS=(
  "centers:Centers:CentersService"
  "stores:Stores:StoresService"
  "items:Items:ItemsService"
  "customers:Customers:CustomersService"
  "devices:Devices:DevicesService"
  "device-brands:DeviceBrands:DeviceBrandsService"
  "item-types:ItemTypes:ItemTypesService"
  "payment-types:PaymentTypes:PaymentTypesService"
  "repair-status:RepairStatus:RepairStatusService"
  "orders:Orders:OrdersService"
  "service-orders:ServiceOrders:ServiceOrdersService"
  "appointments:Appointments:AppointmentsService"
  "inventory-movements:InventoryMovements:InventoryMovementsService"
  "notifications:Notifications:NotificationsService"
)


echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    🚀 MODERNIZACIÓN DE 14 CRUDs 🚀                         ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

CONTADOR=0
for crud in "${CRUDS[@]}"; do
  ((CONTADOR++))
  IFS=':' read -r FEATURE MODEL SERVICE <<< "$crud"
  
  echo -e "${BLUE}[$CONTADOR/14] Procesando $MODEL...${NC}"
  
  FEATURE_DIR="$BASEDIR/src/app/features/$FEATURE"
  mkdir -p "$FEATURE_DIR"
  
  # Copiar y reemplazar list-modern
  cp "$TEMPLATE_DIR/employees-list-modern.component.ts" "$FEATURE_DIR/${FEATURE}-list-modern.component.ts"
  perl -i -pe "s/employees/$FEATURE/g; s/Employees/$MODEL/g; s/EmployeesService/$SERVICE/g; s/EmployeeListState/${MODEL}ListState/g;" "$FEATURE_DIR/${FEATURE}-list-modern.component.ts"
  echo -e "${GREEN}  ✓ TS List${NC}"
  
  cp "$TEMPLATE_DIR/employees-list-modern.component.html" "$FEATURE_DIR/${FEATURE}-list-modern.component.html"
  perl -i -pe "s/empleados/$FEATURE/g; s/Empleados/$MODEL/g;" "$FEATURE_DIR/${FEATURE}-list-modern.component.html"
  echo -e "${GREEN}  ✓ HTML List${NC}"
  
  cp "$TEMPLATE_DIR/employees-list-modern.component.scss" "$FEATURE_DIR/${FEATURE}-list-modern.component.scss"
  echo -e "${GREEN}  ✓ SCSS List${NC}"
  
  # Copiar y reemplazar form-modern
  cp "$TEMPLATE_DIR/employees-form-modern.component.ts" "$FEATURE_DIR/${FEATURE}-form-modern.component.ts"
  perl -i -pe "s/employees/$FEATURE/g; s/Employees/$MODEL/g; s/EmployeesService/$SERVICE/g; s/EmployeeFormState/${MODEL}FormState/g;" "$FEATURE_DIR/${FEATURE}-form-modern.component.ts"
  echo -e "${GREEN}  ✓ TS Form${NC}"
  
  cp "$TEMPLATE_DIR/employees-form-modern.component.html" "$FEATURE_DIR/${FEATURE}-form-modern.component.html"
  perl -i -pe "s/empleado/$FEATURE/g; s/Empleado/$MODEL/g;" "$FEATURE_DIR/${FEATURE}-form-modern.component.html"
  echo -e "${GREEN}  ✓ HTML Form${NC}"
  
  cp "$TEMPLATE_DIR/employees-form-modern.component.scss" "$FEATURE_DIR/${FEATURE}-form-modern.component.scss"
  echo -e "${GREEN}  ✓ SCSS Form${NC}"
  
  echo ""
done

echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Replicación completada para 14 CRUDs${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Compilando para validar...${NC}"
cd "$BASEDIR"
npm run build 2>&1 | tail -30

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ TODOS LOS CRUDs MODERNIZADOS ✅                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
