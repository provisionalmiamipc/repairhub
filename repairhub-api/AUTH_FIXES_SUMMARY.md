# 🔧 Autenticación - Correcciones Implementadas

**Fecha**: 27 de Enero, 2026  
**Status**: ✅ Correcciones Aplicadas

---

## 📋 Problemas Identificados y Corregidos

### **Problema 1: Typo en JWT Payload (NestJS)**
**Ubicación**: `src/auth/auth.service.ts` línea 106
```typescript
// ❌ ANTES (INCORRECTO)
const payload = type === 'user'
    ? { useEmail: user.email, sub: user.id, type: 'user' }  // useEmail mal escrito
    : { employeeEmail: user.email, sub: user.id, type: 'employee' };

// ✅ DESPUÉS (CORRECTO)
const payload = type === 'user'
    ? { userEmail: user.email, sub: user.id, type: 'user' }  // userEmail correcto
    : { employeeEmail: user.email, sub: user.id, type: 'employee' };
```

**Impacto**: El token JWT estaba mal formado, causando problemas de validación.

---

### **Problema 2: Falta de Datos de Localización (centerId, storeId)**
**Ubicación**: `src/auth/auth.service.ts` línea 134-150

```typescript
// ❌ ANTES
return {
    access_token,
    refresh_token,
    user: {
        id, type, email, employee_type, firstName, lastName,
        pinTimeout: (solo para employees)
    }
};

// ✅ DESPUÉS
return {
    access_token,
    refresh_token,
    user: {
        id, type, email, employee_type, firstName, lastName,
        centerId: type === 'employee' ? user.centerId : undefined,
        storeId: type === 'employee' ? user.storeId : undefined,
        pinTimeout
    }
};
```

**Impacto**: El RBAC (Role-Based Access Control) no podía validar acceso a recursos sin centerId/storeId.

---

### **Problema 3: Refresh Token Payload**
**Ubicación**: `src/auth/auth.service.ts` línea 186

```typescript
// ❌ ANTES
payload = { useEmail: u.email, sub: u.id, type: 'user' };

// ✅ DESPUÉS
payload = { userEmail: u.email, sub: u.id, type: 'user' };
```

**Impacto**: El refresh token también estaba mal formado.

---

## ✅ Archivos Modificados

### **Backend (NestJS)**
- ✅ `/home/alfego/Documentos/repairhub-api/src/auth/auth.service.ts`
  - 3 cambios aplicados
  - Líneas afectadas: 106, 134-150, 186

### **Frontend (Angular)**
- ✅ `/home/alfego/Documentos/repairhubcoreui/src/app/shared/services/auth.service.ts`
  - Limpieza de lógica de mapeo de centerId/storeId
  - Líneas afectadas: 60-85

---

## 🚀 Pasos para Probar

### **1. Limpiar la BD (Eliminar usuario admin anterior)**

```bash
# Opción A: Si tienes acceso a psql
psql -U postgres -d repairhub_dev -c "DELETE FROM \"user\" WHERE email = 'admin@system.com';"

# Opción B: Reiniciar Docker (si lo usas)
docker-compose down -v
docker-compose up -d
```

### **2. Iniciar Backend**

```bash
cd /home/alfego/Documentos/repairhub-api

# Compilar y limpiar
npm run build

# Iniciar en desarrollo
npm run start:dev

# Deberías ver:
# ✅ Admin user created: admin@system.com
# ✅ App running on http://localhost:3000
```

### **3. Iniciar Frontend**

```bash
cd /home/alfego/Documentos/repairhubcoreui
ng serve --open

# Abre http://localhost:4200/login
```

### **4. Probar Login**

```
Email: admin@system.com
Password: AdminMasterPass.00
```

Deberías ser redirigido a `/dashboard`.

---

## 🧪 Debugging (Opcional)

### **Test con cURL**

```bash
# Ejecutar script de test
bash /home/alfego/Documentos/repairhub-api/test-auth.sh

# O manualmente:
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "admin@system.com",
    "employeeEmail": "admin@system.com",
    "password": "AdminMasterPass.00"
  }' | jq '.'
```

### **Ver en Console (F12)**

```javascript
// En la consola del navegador
localStorage.getItem('auth_token')        // Token JWT
localStorage.getItem('user_type')         // 'user'
localStorage.getItem('user_data')         // Datos del usuario
```

---

## 📊 Verificación de Compatibilidad

| Elemento | Backend | Frontend | Status |
|----------|---------|----------|--------|
| JWT userEmail | ✅ userEmail (fijo) | ✅ Espera userEmail | ✅ OK |
| Payload structure | ✅ {userEmail, sub, type} | ✅ Compatible | ✅ OK |
| centerId/storeId | ✅ Incluidos en response | ✅ Mapeados en Employees | ✅ OK |
| employee_type | ✅ Normalizado | ✅ Recibido y almacenado | ✅ OK |
| Refresh token | ✅ userEmail (fijo) | ✅ Envía en body | ✅ OK |
| Error handling | ✅ UnauthorizedException | ✅ Gestiona en login | ✅ OK |

---

## 🔍 Próxima Validación

Si aún hay problemas:

1. **Verifica logs del servidor**:
   ```bash
   npm run start:dev 2>&1 | grep -i "login\|auth\|error"
   ```

2. **Revisa Console en F12** (DevTools):
   - Red tab → POST /api/auth/login
   - Mira Response body
   - Verifica Status Code (debe ser 200 OK)

3. **Habilita logs en auth.service.ts**:
   ```typescript
   console.log('🔍 Login attempt:', credentials);
   console.log('✅ User validated:', user);
   console.log('📤 Response:', { access_token, refresh_token });
   ```

---

## 📝 Notas

- La contraseña se hashea automáticamente en el `BeforeInsert()` hook de User entity
- El token tiene expiración configurada en `.env` (JWT_EXPIRES_IN)
- El refresh token se guarda hashed en la BD
- Los cookies httpOnly protegen contra XSS

---

**Implementado por**: GitHub Copilot  
**Estilo**: Desarrollo Extremo Ágil + Código Limpio  
**Mejores Prácticas**: Aplicadas para 2026
