#!/bin/bash

# 🧪 Script de Prueba Completa de Autenticación
# Prueba login con ambas tablas: USER y EMPLOYEE

API_URL="${1:-http://localhost:3000}"
ADMIN_EMAIL="admin@system.com"
ADMIN_PASSWORD="AdminMasterPass.00"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 TEST: Autenticación Dual (User + Employee)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 API URL: $API_URL"
echo ""

# ─────────────────────────────────────────────
# TEST 1: Login con email genérico (dual lookup)
# ─────────────────────────────────────────────
echo "═══ TEST 1: Login Genérico (email) ═══"
echo "POST /api/auth/login"
echo "Body: { email: '$ADMIN_EMAIL', password: '***' }"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Status: $HTTP_CODE"
echo "📤 Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Error en login genérico"
  TOKEN=""
else
  TOKEN=$(echo "$BODY" | jq -r '.access_token // empty' 2>/dev/null)
  USER_TYPE=$(echo "$BODY" | jq -r '.user.type // empty' 2>/dev/null)
  echo "✅ Login exitoso - Tipo: $USER_TYPE"
fi
echo ""

# ─────────────────────────────────────────────
# TEST 2: Login específico con userEmail
# ─────────────────────────────────────────────
echo "═══ TEST 2: Login User (userEmail) ═══"
echo "POST /api/auth/login"
echo "Body: { userEmail: '$ADMIN_EMAIL', password: '***' }"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userEmail\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Status: $HTTP_CODE"
echo "📤 Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Error en login con userEmail"
else
  TOKEN=$(echo "$BODY" | jq -r '.access_token // empty' 2>/dev/null)
  USER_TYPE=$(echo "$BODY" | jq -r '.user.type // empty' 2>/dev/null)
  echo "✅ Login exitoso - Tipo: $USER_TYPE"
fi
echo ""

# ─────────────────────────────────────────────
# TEST 3: Endpoint específico /login/user
# ─────────────────────────────────────────────
echo "═══ TEST 3: Endpoint /login/user ═══"
echo "POST /api/auth/login/user"
echo "Body: { userEmail: '$ADMIN_EMAIL', password: '***' }"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login/user" \
  -H "Content-Type: application/json" \
  -d "{\"userEmail\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Status: $HTTP_CODE"
if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Error: $BODY"
else
  TOKEN=$(echo "$BODY" | jq -r '.access_token // empty' 2>/dev/null)
  USER_TYPE=$(echo "$BODY" | jq -r '.user.type // empty' 2>/dev/null)
  echo "✅ Login exitoso - Tipo: $USER_TYPE"
  echo "🔐 Token: ${TOKEN:0:30}..."
fi
echo ""

# ─────────────────────────────────────────────
# TEST 4: Verificar datos en token
# ─────────────────────────────────────────────
if [ ! -z "$TOKEN" ]; then
  echo "═══ TEST 4: Decodificar JWT ═══"
  
  # Decodificar JWT manualmente (sin verificación, solo lectura)
  PAYLOAD=$(echo "$TOKEN" | cut -d. -f2)
  PADDING=$((4 - ${#PAYLOAD} % 4))
  if [ $PADDING -ne 4 ]; then
    PAYLOAD="$PAYLOAD$(printf '%*s' $PADDING | tr ' ' '=')"
  fi
  
  DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null | jq '.' 2>/dev/null)
  
  if [ ! -z "$DECODED" ]; then
    echo "📋 Payload:"
    echo "$DECODED" | jq '.'
  fi
  echo ""
fi

# ─────────────────────────────────────────────
# TEST 5: Test con credenciales inválidas
# ─────────────────────────────────────────────
echo "═══ TEST 5: Credenciales Inválidas ═══"
echo "POST /api/auth/login"
echo "Body: { email: 'wrong@email.com', password: 'wrongpass' }"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"wrong@email.com\",\"password\":\"wrongpass\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Status: $HTTP_CODE"
if [ "$HTTP_CODE" == "401" ]; then
  echo "✅ Correctamente rechazado con 401 Unauthorized"
else
  echo "❌ Esperaba 401, recibí $HTTP_CODE"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Pruebas completadas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
