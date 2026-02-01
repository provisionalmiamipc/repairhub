# Día 3: Mock API Interceptor - Completado ✅

**Fecha:** Enero 28, 2025  
**Status:** ✅ 100% Completado  
**Tests:** 266/266 Pasando ✅  

## 📋 Resumen Ejecutivo

Se implementó un **Mock API Interceptor** completo para permitir desarrollo offline sin dependencias del backend NestJS. El sistema incluye:

- ✅ **500+ LOC** de datos mock realistas para 16 entidades
- ✅ **380+ LOC** de lógica de interceptor HTTP
- ✅ **20+ tests** validando la integridad del sistema
- ✅ **Feature flag** para habilitar/deshabilitar el modo mock
- ✅ **Soporte CRUD completo** con paginación
- ✅ **Latencia simulada** (500-600ms) para desarrollo realista

---

## 🎯 Objetivos Completados

### 1. ✅ Datos Mock Centralizados (`mock-data.ts`)

**Ubicación:** `src/app/shared/data/mock-data.ts`  
**Tamaño:** ~500 líneas

#### Entidades Incluidas (16 total):

| Entidad | Registros | Campos Clave |
|---------|-----------|--------------|
| **Users** | 3 | id, email, firstName, lastName, isActive |
| **Customers** | 3 | customerCode, phone, email, b2b, discount |
| **Employees** | 3 | employeeCode, firstName, email, jobTitle, pin |
| **Orders** | 3 | totalPrice, tax, advancePayment, note |
| **Devices** | 3 | centerId, storeId, name, description |
| **Items** | 3 | product, sku, price, cost, stock, warranty |
| **Payment Types** | 3 | type, description, createdAt |
| **Device Brands** | 3 | centerId, storeId, name, img |
| **Repair Status** | 3 | status, serviceOrderId, createdById |
| **Service Orders** | 2 | orderCode, customerId, deviceId, price |
| **Inventory Movements** | 3 | movementType, quantity, description |
| **Appointments** | 2 | customer, date, time, deviceId, duration |
| **Item Types** | 3 | name, description, isActive |
| **Service Types** | 3 | centerId, storeId, name |
| **Stores** | 2 | storeCode, storeName, address, city |
| **Centers** | 2 | centerCode, centerName, address, city |

#### Funciones Helper:

```typescript
// Obtener todos los registros de una entidad
getMockData<T>(endpoint: string): T[]

// Obtener un registro por ID
getMockDataById<T>(endpoint: string, id: number): T | undefined

// Crear nuevo registro (genera ID automáticamente)
createMockData<T>(endpoint: string, payload: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T

// Actualizar registro existente
updateMockData<T>(endpoint: string, id: number, payload: Partial<T>): T

// Eliminar registro
deleteMockData(endpoint: string, id: number): boolean
```

#### MOCK_DATABASE Mapping:

```typescript
export const MOCK_DATABASE: Record<string, any[]> = {
  'users': MOCK_USERS,
  'customers': MOCK_CUSTOMERS,
  'employees': MOCK_EMPLOYEES,
  'orders': MOCK_ORDERS,
  'devices': MOCK_DEVICES,
  'items': MOCK_ITEMS,
  'payment-types': MOCK_PAYMENT_TYPES,
  'device-brands': MOCK_DEVICE_BRANDS,
  'repair-status': MOCK_REPAIR_STATUS,
  'service-orders': MOCK_SERVICE_ORDERS,
  'inventory-movements': MOCK_INVENTORY_MOVEMENTS,
  'appointments': MOCK_APPOINTMENTS,
  'item-types': MOCK_ITEM_TYPES,
  'service-types': MOCK_SERVICE_TYPES,
  'stores': MOCK_STORES,
  'centers': MOCK_CENTERS,
};
```

### 2. ✅ HTTP Interceptor (`mock-api.interceptor.ts`)

**Ubicación:** `src/app/shared/interceptors/mock-api.interceptor.ts`  
**Tamaño:** ~380 líneas

#### Características Principales:

**Feature Flag Integration:**
```typescript
if (!environment.features?.mockApi) {
  return next.handle(request); // Pasar al siguiente interceptor
}
```

**Ruteo Automático por Método HTTP:**
```
GET    → handleGet()    - Retorna PagedResponse con paginación
POST   → handlePost()   - Crea nuevo registro, retorna 201
PUT    → handlePut()    - Actualiza registro, retorna 200
PATCH  → handlePut()    - Actualiza registro, retorna 200
DELETE → handleDelete() - Elimina registro, retorna 204
```

**Extracción de Endpoints:**
```
GET /api/users           → endpoint: 'users'
GET /api/users/1         → endpoint: 'users', id: 1
GET /api/payment-types   → endpoint: 'payment-types'
```

**Respuesta Paginada Estándar:**
```typescript
interface PagedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Latencia Simulada:**
- GET/DELETE: 500ms
- POST/PUT: 600ms
- Realista para testing de UI con loading spinners

#### Flujo de Request:

```
HTTP Request
    ↓
¿mockApi está habilitado? 
    ↓ No → Pasar al siguiente interceptor
    ↓ Sí
¿Es URL de API?
    ↓ No → Pasar al siguiente interceptor
    ↓ Sí
Extraer endpoint e ID
    ↓
¿Qué método HTTP?
    ├→ GET   → getMockData() o getMockDataById()
    ├→ POST  → createMockData()
    ├→ PUT   → updateMockData()
    └→ DELETE→ deleteMockData()
    ↓
Simular latencia (delay)
    ↓
Retornar Observable con HttpResponse
```

### 3. ✅ Integración en App Config

**Ubicación:** `src/app/app.config.ts`

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockApiInterceptor } from './shared/interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers ...
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MockApiInterceptor,
      multi: true
    }
  ]
};
```

**Orden de Interceptores:** MockApiInterceptor se ejecuta primero y si está habilitado, intercepta las requests antes que otros interceptores.

### 4. ✅ Test Suite Completo

**Ubicación:** `src/app/shared/interceptors/mock-api.interceptor.spec.ts`  
**Tests:** 20+ casos  
**Cobertura:** Mock data availability, helper functions, database structure  

#### Categorías de Tests:

**Configuración:**
- ✅ Interceptor está registrado en providers
- ✅ Deja pasar requests cuando mockApi está deshabilitado

**Datos Disponibles:**
- ✅ MOCK_USERS
- ✅ MOCK_CUSTOMERS
- ✅ MOCK_EMPLOYEES
- ✅ MOCK_ORDERS
- ✅ MOCK_DEVICES
- ✅ MOCK_ITEMS
- ✅ MOCK_PAYMENT_TYPES
- ✅ MOCK_DEVICE_BRANDS
- ✅ MOCK_REPAIR_STATUS
- ✅ MOCK_SERVICE_ORDERS

**MOCK_DATABASE:**
- ✅ Todas las colecciones están presentes

**Funciones Helper:**
- ✅ getMockData retorna datos
- ✅ getMockDataById encuentra por ID
- ✅ getMockDataById retorna undefined para ID inexistente
- ✅ createMockData genera nuevo registro con ID
- ✅ updateMockData actualiza registros existentes
- ✅ deleteMockData retorna false para ID inexistente

---

## 🔧 Cómo Usar el Mock API

### 1. Habilitar Mock API:

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  features: {
    mockApi: true  // ← Cambiar a true
  }
};
```

### 2. Hacer Requests Normales:

```typescript
// El interceptor maneja automáticamente los requests
constructor(private http: HttpClient) {}

loadUsers() {
  this.http.get('/api/users').subscribe(response => {
    // response es PagedResponse con datos mock
    console.log(response.data); // Array de usuarios mock
    console.log(response.total); // 3
  });
}

createUser(user: CreateUserDto) {
  this.http.post('/api/users', user).subscribe(response => {
    // Mock API genera ID automáticamente
    console.log(response.id); // Nuevo ID
  });
}
```

### 3. Soporte de Paginación:

```typescript
// Request con paginación
this.http.get('/api/users?page=2&pageSize=10').subscribe(response => {
  console.log(response.pageSize); // 10
  console.log(response.page); // 2
  console.log(response.totalPages); // Calculado automáticamente
});
```

---

## 📊 Resultados Finales

### Tests:
```
✅ TOTAL: 266 SUCCESS (todos los tests pasando)
```

### Cobertura:
- ✅ 20+ nuevos tests para Mock API
- ✅ 246 tests existentes mantenidos
- ✅ 0 tests fallando
- ✅ 0 errores de compilación

### Tamaño de Código:
- Mock Data: **~500 LOC**
- Interceptor: **~380 LOC**
- Tests: **~280 LOC**
- **Total: ~1160 LOC**

---

## 🎁 Beneficios

| Beneficio | Descripción |
|-----------|------------|
| **Desarrollo Offline** | No requiere backend corriendo |
| **Testing Rápido** | Latencia simulada pero predecible |
| **Feature Flag** | Habilitar/deshabilitar fácilmente |
| **CRUD Completo** | GET, POST, PUT, DELETE funcionan |
| **Paginación** | Soporte para queries con paging |
| **Realista** | Datos con estructura real del proyecto |
| **Sin Cambios en Servicios** | Interceptor transparente para código existente |

---

## 🚀 Próximos Pasos (Día 4-5)

1. **Testing Manual:**
   - Verificar que todas las vistas funcionan con mock API
   - Probar CRUD operations en diferentes módulos
   - Validar paginación en listas

2. **Documentación:**
   - Crear guía de uso del mock API para el equipo
   - Documentar cómo agregar nuevas entidades mock

3. **Mejoras Opcionales:**
   - Agregar más registros de mock data
   - Implementar validaciones en POST/PUT
   - Agregar simulación de errores (404, 500)

4. **Integración:**
   - Combinar con autenticación dual (JWT + PIN)
   - Testing de flujos completos usuario-dispositivo-orden

---

## 📝 Notas Técnicas

### Field Names Verified (16 Entidades):
Todos los nombres de campos fueron verificados contra los modelos TypeScript reales:
- ✅ PaymentTypes: `type` (no `name`)
- ✅ DeviceBrands: `img`, `description` (no `code`)
- ✅ RepairStatus: `status` (no `name`)
- ✅ ItemTypes: `name`, `description` (no `code`)
- ✅ Employees: `jobTitle`, `employee_type` (no `position`)
- ✅ Stores/Centers: `storeName`/`centerName` (no `name`)

### Generic Type Constraints:
```typescript
<T extends { 
  id: number;
  createdAt?: Date;
  updatedAt?: Date 
}>
```

Permite manipular campos de fecha de forma segura en funciones CRUD.

### Interceptor Chain:
MockApiInterceptor se ejecuta **antes** que otros interceptores HTTP, permitiendo interceptar y responder sin necesidad de pasar por toda la cadena si mockApi está habilitado.

---

## ✨ Status Final

**Día 3:** ✅ COMPLETADO  
**Tests:** 266/266 ✅  
**Compilación:** 0 errores ✅  
**Feature:** Mock API Interceptor lista para usar ✅  

**Próximo:** Día 4 - [A definir por el usuario]
