#!/bin/bash

# Script para probar autenticación
# Uso: bash test-auth.sh

API_URL="http://localhost:3000"
EMAIL="admin@system.com"
PASSWORD="AdminMasterPass.00"

echo "🧪 Testing Auth Endpoints"
echo "========================="
echo ""

# 1. Test login endpoint
echo "📝 Login Request:"
echo "POST $API_URL/api/auth/login"
echo "Body: { userEmail: '$EMAIL', employeeEmail: '$EMAIL', password: '***' }"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userEmail\":\"$EMAIL\",\"employeeEmail\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "✅ Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No access_token in response"
  exit 1
fi

echo "🔐 Token: ${TOKEN:0:20}..."
echo ""

# 3. Test protected endpoint
echo "📝 Getting Current User:"
echo "GET $API_URL/api/auth/me"
echo ""

ME=$(curl -s -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "✅ Response:"
echo "$ME" | jq '.' 2>/dev/null || echo "$ME"
