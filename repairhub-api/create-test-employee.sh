#!/bin/bash

# Script para crear un employee de prueba

API_URL="http://localhost:3000"

echo "🔧 Creando employee de prueba..."
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/employees" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Employee",
    "gender": "Male",
    "phone": "+5491234567890",
    "email": "test@employee.com",
    "city": "Buenos Aires",
    "employee_type": "AdminStore",
    "jobTitle": "Store Manager",
    "pinTimeout": 5,
    "pin": "1234",
    "password": "Employee123!",
    "centerId": 1,
    "storeId": 1
  }')

echo "$RESPONSE" | jq '.'

echo ""
echo "📋 Credenciales del employee:"
echo "Email: test@employee.com"
TEMP_PASS=$(echo "$RESPONSE" | jq -r '.tempPassword // empty')
if [ -n "$TEMP_PASS" ]; then
  echo "Password temporal: $TEMP_PASS"
else
  echo "Password: Employee123!"
fi
echo "PIN: 1234"
echo ""
echo "✅ Employee creado. Intenta hacer login con estas credenciales."
