# Opción B: Autenticación Dual (JWT + PIN) - Plan e Implementación

**Fecha:** 28 Enero 2026  
**Status:** ⏳ EN PROGRESO  
**Tiempo Estimado:** 4-5 horas  

---

## 📋 Estado Actual de Autenticación

### Backend (NestJS) - Ya Implementado ✅

**Auth Service existente:**
- ✅ POST `/api/auth/login` - Login unificado (usuario/empleado)
- ✅ POST `/api/auth/login/user` - Login específico para usuarios
- ✅ POST `/api/auth/login/employee` - Login específico para empleados
- ✅ POST `/api/auth/verify-pin` - Verificación de PIN (requiere JWT previo)
- ✅ POST `/api/auth/refresh` - Refresh token
- ✅ JWT y Refresh tokens generados
- ✅ Cookies de refresh token

**Flujo actual del backend:**
```
POST /api/auth/login
  ↓
Si OK → Retorna JWT + Refresh Token
  ↓
Si empleado → Requiere POST /api/auth/verify-pin (con JWT)
```

---

### Frontend (Angular) - Parcialmente Implementado

**Existente:**
- ✅ AuthService con login()
- ✅ AuthResponse model
- ✅ Auth Guard
- ✅ Auth Interceptor
- ⚠️ PIN verification no está integrado
- ⚠️ Mock API no soporta PIN

**Lo que falta:**
1. ❌ Pantalla de login con flujo de PIN
2. ❌ Servicio de PIN verification integrado
3. ❌ Componente para ingresar PIN
4. ❌ Mock data con PIN para testing

---

## 🎯 Objetivos de Opción B

### 1. Integración Frontend - Flujo Dual Auth

```
USUARIO (email + password)
  ↓
POST /api/auth/login
  ↓
Recibe JWT
  ↓
✅ Login completado
  ↓
Accede a dashboard

EMPLEADO (email + password)
  ↓
POST /api/auth/login
  ↓
Recibe JWT (temporal)
  ↓
Requiere PIN
  ↓
Ingresa PIN en modal
  ↓
POST /api/auth/verify-pin
  ↓
Recibe JWT final
  ↓
✅ Login completado
  ↓
Accede a dashboard
```

### 2. Crear Componentes Necesarios

1. **PIN Input Component** - Modal para ingresar PIN
2. **Auth Service Update** - Método para verify-pin
3. **Login Component Update** - Flujo condicional para PIN
4. **Mock API Update** - Soporte para PIN verification

### 3. Integración Mock API

Mock API debe:
- Detectar si es empleado
- Retornar JWT requerido para verify-pin
- Soportar verify-pin endpoint
- Generar segundo JWT después de validar PIN

---

## 📁 Archivos a Crear/Modificar

### Archivos a CREAR:

```
1. src/app/shared/components/pin-input-modal/
   ├── pin-input-modal.component.ts
   ├── pin-input-modal.component.html
   ├── pin-input-modal.component.scss
   └── pin-input-modal.component.spec.ts

2. src/app/shared/models/pin-verification.model.ts
   - Interface para PIN verification response

3. src/app/shared/data/mock-pin-auth.ts
   - Lógica de PIN verification para mock API
```

### Archivos a MODIFICAR:

```
1. src/app/shared/services/auth.service.ts
   - Agregar método verifyPin()
   - Agregar método checkIfPinRequired()
   - Manejo de flujo dual auth

2. src/app/shared/data/mock-data.ts
   - Agregar PINs a empleados mock
   - Agregar lógica de verificación

3. src/app/shared/interceptors/mock-api.interceptor.ts
   - Agregar handler para /api/auth/verify-pin
   - Agregar lógica de PIN validation

4. src/app/views/login/ (si existe)
   OR src/app/features/auth/login/ (según estructura)
   - Integrar PIN modal en flujo de login
```

---

## 🔄 Flujo Técnico Detallado

### 1️⃣ POST /api/auth/login

**Request:**
```typescript
{
  email: "juan@repairhub.com",  // o employeeEmail
  password: "password123"
}
```

**Response (Empleado):**
```typescript
{
  access_token: "eyJhbGc...",    // JWT requerido para PIN
  refresh_token: "eyJhbGc...",
  user: {
    id: 1,
    employeeCode: "EMP001",
    firstName: "Juan",
    email: "juan@repairhub.com",
    employee_type: "Employee"
    pin: "1234"  // Mock API retorna esto
  },
  userType: "employee"
}
```

**Response (Usuario):**
```typescript
{
  access_token: "eyJhbGc...",    // JWT final
  refresh_token: "eyJhbGc...",
  user: {
    id: 1,
    email: "admin@repairhub.com",
    firstName: "Admin",
    isActive: true
  },
  userType: "user"
}
```

### 2️⃣ POST /api/auth/verify-pin (si es empleado)

**Request:**
```typescript
{
  pin: "1234"  // Ingresado por usuario
}
// Header: Authorization: Bearer {access_token de login anterior}
```

**Response:**
```typescript
{
  access_token: "eyJhbGc...",   // JWT final válido para dashboard
  refresh_token: "eyJhbGc...",
  verified: true,
  user: {
    id: 1,
    employeeCode: "EMP001",
    firstName: "Juan",
    email: "juan@repairhub.com",
    employee_type: "Employee"
  },
  userType: "employee"
}
```

---

## 🧩 Estructura del PIN Input Modal

```typescript
// pin-input-modal.component.ts

@Component({
  selector: 'app-pin-input-modal',
  templateUrl: './pin-input-modal.component.html',
  styleUrls: ['./pin-input-modal.component.scss']
})
export class PinInputModalComponent {
  @Output() pinSubmit = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  
  pinForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  
  constructor(private formBuilder: FormBuilder) {
    this.pinForm = this.formBuilder.group({
      pin: ['', [Validators.required, Validators.minLength(4)]]
    });
  }
  
  onSubmit() {
    if (this.pinForm.valid) {
      this.pinSubmit.emit(this.pinForm.get('pin')?.value);
      this.isLoading = true;
    }
  }
  
  onCancel() {
    this.cancel.emit();
  }
}
```

---

## 🔐 Mock API PIN Verification Logic

```typescript
// En mock-api.interceptor.ts

private handleVerifyPin(body: { pin: string }): Observable<HttpResponse<any>> {
  // 1. Extraer usuario de JWT anterior (desde sessionStorage/localStorage)
  // 2. Obtener empleado mock
  // 3. Comparar PIN ingresado con PIN en datos mock
  // 4. Si coincide: retornar JWT final con token actualizado
  // 5. Si NO coincide: retornar 401 Unauthorized
  
  const storedEmployee = this.getCurrentEmployeeFromStorage();
  if (!storedEmployee) {
    return this.mockError('No employee found', 401);
  }
  
  const mockEmployee = getMockDataById('employees', storedEmployee.id);
  if (!mockEmployee || mockEmployee.pin !== body.pin) {
    return this.mockError('Invalid PIN', 401);
  }
  
  // PIN válido - retornar JWT actualizado
  const response = {
    access_token: this.generateFakeJWT(),
    verified: true,
    user: mockEmployee,
    userType: 'employee'
  };
  
  return of(new HttpResponse({ body: response, status: 200 }));
}
```

---

## 📊 Datos Mock Necesarios

### MOCK_EMPLOYEES actualizado con PIN:

```typescript
export const MOCK_EMPLOYEES: Employees[] = [
  {
    id: 1,
    employeeCode: 'EMP001',
    firstName: 'Juan',
    lastName: 'García',
    email: 'juan@repairhub.com',
    pin: '1234',  // ← PIN para testing
    employee_type: 'Employee',
    jobTitle: 'Técnico de Reparación',
    // ... resto de campos
  },
  {
    id: 2,
    employeeCode: 'EMP002',
    firstName: 'María',
    lastName: 'López',
    email: 'maria@repairhub.com',
    pin: '5678',  // ← PIN diferente
    employee_type: 'Manager',
    jobTitle: 'Gerente de Tienda',
    // ... resto de campos
  },
  // ... más empleados
];
```

### MOCK_USERS (sin PIN):

```typescript
export const MOCK_USERS: Users[] = [
  {
    id: 1,
    email: 'admin@repairhub.com',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    // ... resto de campos
  },
  // ... más usuarios
];
```

---

## 🧪 Testing del Flujo Completo

### Caso 1: Login de Empleado

```javascript
// 1. Primer login
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'juan@repairhub.com',
    password: 'password123'
  })
}).then(r => r.json()).then(data => {
  // data.userType === 'employee'
  // data.access_token presente
  
  // 2. Ingresar PIN
  fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${data.access_token}` },
    body: JSON.stringify({ pin: '1234' })
  }).then(r => r.json()).then(pinData => {
    // pinData.verified === true
    // pinData.access_token presente (actualizado)
  })
})
```

### Caso 2: Login de Usuario

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'admin@repairhub.com',
    password: 'password123'
  })
}).then(r => r.json()).then(data => {
  // data.userType === 'user'
  // data.access_token presente
  // ✅ SIN necesidad de PIN - va directo a dashboard
})
```

---

## 📋 Checklist de Implementación

### Fase 1: Estructura (1 hora)
- [ ] Crear PIN Input Modal component
- [ ] Crear PIN verification model
- [ ] Crear mock PIN auth logic file

### Fase 2: Auth Service (1 hora)
- [ ] Agregar verifyPin() method
- [ ] Agregar checkIfPinRequired() method
- [ ] Actualizar login() para detectar empleados
- [ ] Manejo de JWT dual (pre-PIN y post-PIN)

### Fase 3: Mock API (1 hora)
- [ ] Actualizar MOCK_EMPLOYEES con PINs
- [ ] Agregar handler /api/auth/verify-pin
- [ ] Implementar PIN validation logic
- [ ] Simular latencia

### Fase 4: Login Component (1 hora)
- [ ] Integrar PIN modal en flujo login
- [ ] Mostrar modal solo para empleados
- [ ] Manejo de errores de PIN
- [ ] Validación de intentos

### Fase 5: Testing (1 hora)
- [ ] Probar login de usuario (sin PIN)
- [ ] Probar login de empleado (con PIN)
- [ ] Probar PIN incorrecto
- [ ] Probar flujo completo end-to-end
- [ ] Actualizar tests de auth.service

---

## 🔗 Recursos Relacionados

**Documentación de autenticación existente:**
- Auth Service: `src/app/shared/services/auth.service.ts`
- Auth Controller (Backend): `src/auth/auth.controller.ts`
- Auth Model: `src/app/shared/models/auth-response.model.ts`

**Documentación del proyecto:**
- Autenticación NestJS: `/repairhub-api/docs/AUTHENTICATION.md`
- Mock API: `MOCK_API_TESTING_GUIDE.md`

---

## ⚙️ Configuración en environment.ts

Ya debería tener:

```typescript
auth: {
  login: '/auth/login',
  verify_pin: '/auth/verify-pin',  // ← Agregar
  refresh: '/auth/refresh',
  // ... otros endpoints
}
```

---

## 📊 Impacto Esperado

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Login Usuario** | Email + Password | Email + Password ✅ |
| **Login Empleado** | Email + Password (sin PIN) | Email + Password + PIN ✅ |
| **Seguridad Empleado** | Bajo | Alto ✅ |
| **Flujo Dual** | No existe | Implementado ✅ |
| **Mock API Support** | Sin PIN | Con PIN ✅ |
| **Tests** | Sin PIN | Con PIN ✅ |

---

## 🚀 Próximos Pasos

1. **AHORA:** Crear PIN Input Modal component
2. **Luego:** Actualizar AuthService con verifyPin()
3. **Después:** Integrar en Mock API
4. **Finalmente:** Integrar en Login component
5. **Testing:** Validar flujo completo

---

## 💡 Notas Técnicas

### JWT Management
- Access token corto (5-15 min)
- Refresh token largo (7 días)
- POST /api/auth/verify-pin actualiza access_token
- Mock API genera JWTs falsos pero válidos para testing

### PIN Handling
- PINs en mock data NO son secretos (es testing)
- En producción: JWTs tienen expiry
- Después de X intentos fallidos: bloquear sesión
- Después de Y minutos de inactividad: re-verificar PIN

### Security Layers
1. Email + Password → JWT (acceso a datos)
2. PIN Verification → JWT actualizado (acceso completo para empleados)
3. Refresh Token → Renovación sin re-login

---

## 📞 Status

**Preparado:** Todos los archivos a crear/modificar están identificados  
**Documentado:** Plan detallado con ejemplos de código  
**Pronto:** Implementación en 5 fases  

¿Comenzamos con la implementación? 🚀
