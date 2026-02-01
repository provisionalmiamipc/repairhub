# 🧪 Testing E2E - RepairHub Users Module

## Prerequisitos

1. **Backend corriendo** en `http://localhost:3000`
2. **Angular dev server** en `http://localhost:4200`
3. **Usuario admin creado** en la BD

---

## 🔧 Configuración para Testing Real

### 1. Variables de entorno

Verifica en `src/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',  // ← IMPORTANTE
  apiVersion: 'v1',
  // ...
};
```

### 2. Endpoints esperados en Backend

```
POST   /api/auth/login           → Obtener access_token
POST   /api/auth/login/user      → Login para Users
GET    /api/user                 → Listar usuarios
POST   /api/user                 → Crear usuario
GET    /api/user/:id             → Obtener usuario
PATCH  /api/user/:id             → Actualizar usuario
DELETE /api/user/:id             → Eliminar usuario
```

### 3. Flujo de Testing Manual

#### **Paso 1: Login**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourAdminPassword"
  }'

# Respuesta esperada:
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "type": "user"
  }
}
```

**Copiar el token access_token**

#### **Paso 2: Listar usuarios**

```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Respuesta esperada: Array de usuarios

#### **Paso 3: Crear usuario**

```bash
curl -X POST http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "password": "SecurePass123!"
  }'
```

Respuesta esperada:

```json
{
  "id": 100,
  "email": "newuser@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "isActive": true,
  "createdAt": "2025-01-28T...",
  "updatedAt": "2025-01-28T..."
}
```

---

## 🧪 Testing en Angular

### Opción A: Test unitarios (Recomendado para CI/CD)

```bash
# Ejecutar tests unitarios
npm test

# Ver cobertura
npm test -- --code-coverage
```

**Resultado esperado:**
```
TOTAL: 101 SUCCESS
- CustomValidators: 30+ tests ✅
- UsersService: 13 tests ✅
- UsersListPageComponent: 11 tests ✅
```

### Opción B: Test manual en navegador

1. **Arrancar el servidor**

```bash
cd /home/alfego/Documentos/repairhubcoreui
ng serve
```

2. **Navegar a**

```
http://localhost:4200/#/login
```

3. **Login**
   - Email: `admin@example.com`
   - Password: `YourAdminPassword`

4. **Ir a Usuarios**

```
http://localhost:4200/#/users
```

5. **Pruebas manuales**

   - ✅ **Listar**: Deberías ver una tabla con usuarios
   - ✅ **Buscar**: Tipea en la caja de búsqueda
   - ✅ **Crear**: Click en "Nuevo Usuario"
     - Email: newuser@example.com
     - Nombre: Juan
     - Apellido: Pérez
     - Password: StrongPass123! (debe cumplir requisitos)
     - Verificar validaciones en tiempo real
   - ✅ **Editar**: Click en lápiz
     - Cambiar nombre
     - Password es opcional en edición
   - ✅ **Eliminar**: Click en papelera
     - Debe pedir confirmación
   - ✅ **Ver detalle**: Click en ojo

### Opción C: E2E con Cypress (Avanzado)

```bash
npm install --save-dev @cypress/schematic cypress

# Generar tests E2E
ng generate @cypress/schematic:cypress

# Ejecutar
npm run e2e
```

---

## 🔐 Autenticación en Tests

Cada test de integración necesita un token JWT.

**Opción 1: Mock el token**

```typescript
beforeEach(() => {
  localStorage.setItem('auth_token', 'mock-jwt-token');
});
```

**Opción 2: Usar HTTPTestingController (Recomendado)**

```typescript
it('should work with auth interceptor', (done) => {
  service.getAll().subscribe(() => {
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.headers.get('Authorization')).toContain('Bearer');
    done();
  });

  const loginReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
  loginReq.flush({ access_token: 'token' });
});
```

---

## 🐛 Troubleshooting

### Error: 401 Unauthorized

**Causa:** Token expirado o no enviado

**Solución:**

1. Verificar que `auth.interceptor.ts` añade el header

```typescript
function addAuthHeader(req: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const token = authService.getToken();
  
  if (token) {
    return req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  return req;
}
```

2. Verificar que el token está en localStorage

```javascript
// En DevTools Console
localStorage.getItem('auth_token')  // Debe tener valor
```

### Error: CORS blocked

**Solución:** Backend debe tener CORS habilitado

```typescript
// Backend (src/main.ts)
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true,
});
```

### Error: Network timeout

**Causa:** Backend no responde

**Solución:**

1. Verificar que backend está corriendo: `http://localhost:3000`
2. Revisar logs del backend
3. Aumentar timeout si es necesario (en BaseService)

---

## 📊 Matriz de Testing

| Feature | Unit | Integration | E2E |
|---------|------|-------------|-----|
| UsersService CRUD | ✅ | ✅ | ✅ |
| CustomValidators | ✅ | ✅ | ⏳ |
| UsersListPage | ✅ | ✅ | ⏳ |
| UsersFormComponent | ✅ | ⏳ | ⏳ |
| Auth Integration | ✅ | ✅ | ⏳ |

✅ = Completado
⏳ = Próximo

---

## 🎯 Próximos Pasos

1. **Arreglar fallos en UsersService tests** (async/timing)
2. **Crear tests para UsersFormComponent**
3. **E2E completo con Cypress**
4. **Coverage > 80%**
