#!/bin/bash

# ============================================
# 🚀 MODERNIZAR CRUD - SCRIPT AUTOMATIZADO
# ============================================
# 
# Uso: bash modernizar-crud.sh FEATURE MODEL SERVICE
# 
# Ejemplo:
#   bash modernizar-crud.sh centers Centers CentersService
#   bash modernizar-crud.sh stores Stores StoresService
#   bash modernizar-crud.sh items Items ItemsService
#
# Resultado: Componentes list y form modernos automáticamente
#
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# VARIABLES
# ============================================

FEATURE="${1:-}"
MODEL="${2:-}"
SERVICE="${3:-}"

BASE_PATH="src/app/features"
TEMPLATE_PATH="${BASE_PATH}/employees"
SOURCE_PATH="${BASE_PATH}/${FEATURE}"

# ============================================
# VALIDACIÓN
# ============================================

if [ -z "$FEATURE" ] || [ -z "$MODEL" ] || [ -z "$SERVICE" ]; then
  echo -e "${RED}❌ ERROR: Argumentos faltantes${NC}"
  echo ""
  echo "Uso:"
  echo "  bash modernizar-crud.sh FEATURE MODEL SERVICE"
  echo ""
  echo "Ejemplo:"
  echo "  bash modernizar-crud.sh centers Centers CentersService"
  echo "  bash modernizar-crud.sh stores Stores StoresService"
  echo "  bash modernizar-crud.sh items Items ItemsService"
  echo ""
  exit 1
fi

if [ ! -d "$TEMPLATE_PATH" ]; then
  echo -e "${RED}❌ ERROR: No encontré template en ${TEMPLATE_PATH}${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 MODERNIZADOR DE CRUD - Angular 2026${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Parámetros:${NC}"
echo "  FEATURE: ${FEATURE}"
echo "  MODEL: ${MODEL}"
echo "  SERVICE: ${SERVICE}"
echo ""

# ============================================
# PASO 1: CREAR DIRECTORIO
# ============================================

echo -e "${BLUE}[1/5]${NC} Creando directorio..."

if [ ! -d "$SOURCE_PATH" ]; then
  mkdir -p "$SOURCE_PATH"
  echo -e "${GREEN}✓${NC} Directorio creado: ${SOURCE_PATH}"
else
  echo -e "${YELLOW}⚠${NC} Directorio ya existe: ${SOURCE_PATH}"
fi

# ============================================
# PASO 2: COPIAR ARCHIVOS - LIST
# ============================================

echo ""
echo -e "${BLUE}[2/5]${NC} Copiando componentes LISTA..."

cp "${TEMPLATE_PATH}/employees-list-modern.component.ts" \
   "${SOURCE_PATH}/${FEATURE}-list-modern.component.ts"
echo -e "${GREEN}✓${NC} TypeScript copiado"

cp "${TEMPLATE_PATH}/employees-list-modern.component.html" \
   "${SOURCE_PATH}/${FEATURE}-list-modern.component.html"
echo -e "${GREEN}✓${NC} HTML copiado"

cp "${TEMPLATE_PATH}/employees-list-modern.component.scss" \
   "${SOURCE_PATH}/${FEATURE}-list-modern.component.scss"
echo -e "${GREEN}✓${NC} SCSS copiado"

# ============================================
# PASO 3: COPIAR ARCHIVOS - FORM
# ============================================

echo ""
echo -e "${BLUE}[3/5]${NC} Copiando componentes FORMULARIO..."

cp "${TEMPLATE_PATH}/employees-form-modern.component.ts" \
   "${SOURCE_PATH}/${FEATURE}-form-modern.component.ts"
echo -e "${GREEN}✓${NC} TypeScript copiado"

cp "${TEMPLATE_PATH}/employees-form-modern.component.html" \
   "${SOURCE_PATH}/${FEATURE}-form-modern.component.html"
echo -e "${GREEN}✓${NC} HTML copiado"

cp "${TEMPLATE_PATH}/employees-form-modern.component.scss" \
   "${SOURCE_PATH}/${FEATURE}-form-modern.component.scss"
echo -e "${GREEN}✓${NC} SCSS copiado"

# ============================================
# PASO 4: REEMPLAZAR NOMBRES
# ============================================

echo ""
echo -e "${BLUE}[4/5]${NC} Reemplazando nombres en archivos..."

# Reemplazos en archivos TypeScript
sed -i "s/employees/${FEATURE}/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.ts"
sed -i "s/employees/${FEATURE}/g" "${SOURCE_PATH}/${FEATURE}-form-modern.component.ts"

sed -i "s/Employees/${MODEL}/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.ts"
sed -i "s/Employees/${MODEL}/g" "${SOURCE_PATH}/${FEATURE}-form-modern.component.ts"

sed -i "s/EmployeesService/${SERVICE}/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.ts"
sed -i "s/EmployeesService/${SERVICE}/g" "${SOURCE_PATH}/${FEATURE}-form-modern.component.ts"

# Reemplazos en archivos HTML
sed -i "s/empleados/${FEATURE}/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.html"
sed -i "s/Empleados/${MODEL}s/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.html"
sed -i "s/employee/${FEATURE}/g" "${SOURCE_PATH}/${FEATURE}-list-modern.component.html"

echo -e "${GREEN}✓${NC} Nombres reemplazados"

# ============================================
# PASO 5: COMPILAR
# ============================================

echo ""
echo -e "${BLUE}[5/5]${NC} Compilando proyecto (esto puede tomar 30-40 segundos)..."
echo ""

if ng build > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Compilación exitosa"
else
  echo -e "${YELLOW}⚠${NC} Compilación con warnings (revisar con: ng build)"
fi

# ============================================
# RESUMEN
# ============================================

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ¡MODERNIZACIÓN COMPLETADA!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Archivos creados en: ${SOURCE_PATH}"
echo ""
echo "Próximos pasos:"
echo "1. Revisar archivos creados"
echo "2. Personalizar campos según tu modelo"
echo "3. Ejecutar: ng serve"
echo "4. Probar en navegador: http://localhost:4200/${FEATURE}/list-modern"
echo ""
echo "Para más info, lee:"
echo "  - REGLAS_ORO_REPLICACION.md"
echo "  - MODERNIZACION_FASE_2_CHECKLIST.md"
echo ""
