#!/bin/bash

# Test simple de autenticación

API_URL="http://localhost:3000"
ADMIN_EMAIL="admin@system.com"
ADMIN_PASSWORD="AdminMasterPass.00"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  🧪 Test de Autenticación Dual (User)     ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📍 URL: $API_URL"
echo ""

# Test 1: Login con email genérico
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Login Genérico (email)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'"}' | jq '.' 2>/dev/null || echo "Error en request"

echo ""
echo ""

# Test 2: Login con userEmail específico
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Login User (userEmail)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'"}' | jq '.' 2>/dev/null || echo "Error en request"

echo ""
echo ""

# Test 3: Endpoint específico /login/user
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Endpoint /login/user"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

curl -s -X POST "$API_URL/api/auth/login/user" \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"'"$ADMIN_EMAIL"'","password":"'"$ADMIN_PASSWORD"'"}' | jq '.' 2>/dev/null || echo "Error en request"

echo ""
echo ""

# Test 4: Credenciales inválidas
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Credenciales Inválidas (debe 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpass"}')

echo "Status: $HTTP_CODE"
cat /tmp/response.json | jq '.' 2>/dev/null || cat /tmp/response.json

echo ""
echo ""
echo "✅ Tests completados"
