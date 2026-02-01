#!/bin/bash

echo "🛣️  LISTADO DE RUTAS DE LA API"
echo "================================"

# Buscar todos los controladores
CONTROLLERS=$(find src -name "*.controller.ts" -type f)

for controller in $CONTROLLERS; do
    echo ""
    echo "📁 $(basename $controller):"
    echo "------------------------"
    
    # Extraer ruta base del controlador
    BASE_ROUTE=$(grep "@Controller" $controller | sed "s/.*@Controller('\([^']*\)').*/\1/" | sed "s/.*@Controller(\"\([^\"]*\)\").*/\1/")
    
    if [ -z "$BASE_ROUTE" ]; then
        BASE_ROUTE="/"
    else
        BASE_ROUTE="/$BASE_ROUTE"
    fi
    
    # Extraer métodos y rutas
    grep -E "@Get|@Post|@Patch|@Put|@Delete" $controller | while read -r line; do
        METHOD=$(echo "$line" | sed 's/.*@\(Get\|Post\|Patch\|Put\|Delete\).*/\1/')
        SUB_ROUTE=$(echo "$line" | sed 's/.*@\(Get\|Post\|Patch\|Put\|Delete\)(\([^)]*\)).*/\2/' | sed "s/'//g" | sed 's/"//g')
        
        if [ "$SUB_ROUTE" = "Get" ] || [ "$SUB_ROUTE" = "Post" ] || [ "$SUB_ROUTE" = "Patch" ] || [ "$SUB_ROUTE" = "Put" ] || [ "$SUB_ROUTE" = "Delete" ]; then
            SUB_ROUTE=""
        fi
        
        if [ -z "$SUB_ROUTE" ]; then
            echo "  $METHOD    $BASE_ROUTE"
        else
            echo "  $METHOD    $BASE_ROUTE$SUB_ROUTE"
        fi
    done
done