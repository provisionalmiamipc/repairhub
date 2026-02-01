# 📋 Plan de Testing Manual - Mock API

## Objetivo
Validar que el Mock API Interceptor funciona correctamente en todas las vistas principales de la aplicación con desarrollo offline.

## 🎯 Secciones a Probar

### 1. ✅ Autenticación & Login
**URL:** `http://localhost:4200/login`

**Casos a probar:**
- [ ] Formulario de login carga correctamente
- [ ] Click en "Ingresar" hace request al endpoint `/api/users`
- [ ] Mock API retorna datos de usuario (debería haber un usuario mock de prueba)
- [ ] Redirección a dashboard después de login exitoso

**Evidencia esperada:**
- Request `/api/users` retorna PagedResponse
- Status code 200
- Latencia simulada (~500ms)

---

### 2. 👥 Gestión de Usuarios
**URL:** `http://localhost:4200/admin/users` (o similiar)

**Casos a probar:**
- [ ] Lista de usuarios carga con mock data
- [ ] Tabla muestra al menos 3 usuarios
- [ ] Paginación funciona correctamente
- [ ] Click en usuario abre detalle (GET con ID)
- [ ] Botón "Crear" abre formulario de creación

**Operaciones CRUD:**
- [ ] **GET lista:** `/api/users?page=1&pageSize=20` retorna PagedResponse
- [ ] **GET detalle:** `/api/users/1` retorna un usuario específico
- [ ] **POST crear:** Crear nuevo usuario genera ID automático
- [ ] **PUT actualizar:** Cambiar nombre, email, etc.
- [ ] **DELETE eliminar:** Borrar usuario funciona

**Validaciones:**
- [ ] Después de crear, el nuevo usuario aparece en la lista
- [ ] Después de actualizar, los cambios se reflejan
- [ ] Después de eliminar, el usuario desaparece de la lista

---

### 3. 👤 Gestión de Clientes
**URL:** `http://localhost:4200/customers` (o similiar)

**Casos a probar:**
- [ ] Lista de clientes carga (debería haber 3 clientes mock)
- [ ] Se visualizan datos: customerCode, firstName, lastName, email, phone
- [ ] Búsqueda/filtrado funciona
- [ ] Paginación funciona

**Operaciones:**
- [ ] Ver detalle de cliente
- [ ] Crear nuevo cliente
- [ ] Editar cliente existente
- [ ] Eliminar cliente

---

### 4. 📦 Gestión de Órdenes
**URL:** `http://localhost:4200/orders` (o similiar)

**Casos a probar:**
- [ ] Lista de órdenes carga (debería haber 3 órdenes mock)
- [ ] Se visualiza: totalPrice, tax, advancePayment, note, status
- [ ] Filtrar por estado funciona
- [ ] Paginación funciona

**Operaciones:**
- [ ] Ver detalle de orden con todos sus datos
- [ ] Crear nueva orden
- [ ] Actualizar monto, impuesto, pago anticipado
- [ ] Eliminar orden

---

### 5. 🔧 Gestión de Dispositivos
**URL:** `http://localhost:4200/devices` (o similiar)

**Casos a probar:**
- [ ] Lista de dispositivos carga (3 dispositivos mock)
- [ ] Se visualiza: name, description, centerId, storeId
- [ ] Búsqueda funciona
- [ ] Crear nuevo dispositivo
- [ ] Editar dispositivo
- [ ] Eliminar dispositivo

---

### 6. 📋 Gestión de Items/Productos
**URL:** `http://localhost:4200/items` (o similiar)

**Casos a probar:**
- [ ] Lista de items carga (3 items mock)
- [ ] Se visualiza: product, sku, price, cost, stock, warranty
- [ ] Filtrar por disponibilidad
- [ ] Crear item nuevo
- [ ] Actualizar precio/stock
- [ ] Eliminar item

---

### 7. 👨‍💼 Gestión de Empleados
**URL:** `http://localhost:4200/employees` (o similiar)

**Casos a probar:**
- [ ] Lista de empleados carga (3 empleados mock)
- [ ] Se visualiza: employeeCode, firstName, lastName, email, jobTitle
- [ ] Ver detalle de empleado
- [ ] Crear empleado nuevo
- [ ] Editar datos de empleado
- [ ] Eliminar empleado

---

### 8. 💳 Tipos de Pago
**URL:** `http://localhost:4200/payment-types` (o similiar)

**Casos a probar:**
- [ ] Lista carga (3 tipos de pago mock: type, description)
- [ ] Crear nuevo tipo
- [ ] Editar tipo
- [ ] Eliminar tipo

---

### 9. 🏪 Tiendas/Centros
**URLs:**
- `http://localhost:4200/stores` 
- `http://localhost:4200/centers`

**Casos a probar:**
- [ ] Lista de tiendas carga (2 tiendas mock)
- [ ] Lista de centros carga (2 centros mock)
- [ ] Ver detalle de tienda/centro
- [ ] Crear nueva tienda/centro
- [ ] Editar tienda/centro
- [ ] Eliminar tienda/centro

---

### 10. 📅 Citas/Appointments
**URL:** `http://localhost:4200/appointments` (o similiar)

**Casos a probar:**
- [ ] Lista de citas carga (2 citas mock)
- [ ] Se visualiza: customer, date, time, deviceId, serviceTypeId
- [ ] Crear nueva cita
- [ ] Editar cita
- [ ] Eliminar cita

---

## 🧪 Testing de Paginación

Para cada lista, verificar:

**Escenario 1: Primera página**
```
GET /api/{entity}?page=1&pageSize=10
Verificar:
- response.page = 1
- response.pageSize = 10
- response.data.length ≤ 10
- response.totalPages calculado correctamente
```

**Escenario 2: Cambiar pageSize**
```
GET /api/{entity}?page=1&pageSize=5
Verificar:
- response.pageSize = 5
- response.totalPages = total / 5
```

**Escenario 3: Página fuera de rango**
```
GET /api/{entity}?page=99
Debería retornar array vacío o página vacía
```

---

## 🔍 Testing de Latencia

**Verificar con DevTools:**

1. Abre DevTools (F12) → Pestaña Network
2. Haz un request cualquiera (GET lista de usuarios)
3. Verifica:
   - [ ] Latencia es ~500ms (no instantáneo)
   - [ ] Status code correcto (200, 201, 204, etc.)
   - [ ] Response body tiene la estructura esperada

**Latencias esperadas por método:**
- GET: 500ms
- POST: 600ms
- PUT: 600ms
- DELETE: 500ms

---

## 🛠️ Testing de Errores

Verificar manejo de errores:

**Caso 1: GET por ID inexistente**
```
GET /api/users/99999
Esperado: 404 Not Found o undefined
```

**Caso 2: POST sin datos requeridos**
```
POST /api/users {}
Esperado: 400 Bad Request o error de validación
```

---

## 📊 Checklist de Validación

### Estructura de Respuesta
- [ ] Respuestas de lista tienen estructura PagedResponse
- [ ] Respuestas tienen `data[]`, `total`, `page`, `pageSize`, `totalPages`
- [ ] Respuestas de detalle retornan entidad individual

### IDs y Creación
- [ ] POST genera ID único automáticamente
- [ ] ID generado es número > 0
- [ ] Nuevo registro aparece en lista

### Actualización
- [ ] PUT actualiza todos los campos enviados
- [ ] Campos no enviados se mantienen igual
- [ ] Respuesta retorna objeto actualizado

### Eliminación
- [ ] DELETE retorna 204 No Content
- [ ] Registro desaparece de lista
- [ ] GET al ID eliminado retorna 404 o undefined

### Timestamps
- [ ] Nuevos registros tienen `createdAt`
- [ ] Registros actualizados tienen `updatedAt`
- [ ] Fechas son válidas (not null/undefined)

---

## 🔐 Testing de Feature Flag

**Verificar desactivación:**
1. Abre `src/environments/environment.ts`
2. Cambia `mockApi: false`
3. Refresca la página
4. Verifica que ahora los requests van al API real (verás errores de conexión si no está corriendo)
5. Cambia de vuelta a `mockApi: true`

---

## 📝 Reportar Issues

Si encuentras algún problema:

**Formato:**
```
**Problema:** [Descripción corta]
**Módulo:** [Dónde ocurre]
**Pasos para reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado esperado:** [Qué debería pasar]
**Resultado actual:** [Qué pasó en realidad]
**Impacto:** [Alto/Medio/Bajo]
**Solución propuesta:** [Si la tienes]
```

---

## ✅ Criterios de Éxito

El testing es **exitoso** cuando:

✅ Todas las vistas principales cargan sin errores  
✅ CRUD operations funcionan en al menos 3 módulos principales  
✅ Paginación funciona correctamente en listas  
✅ Latencia simulada es notoria pero no excesiva (~500-600ms)  
✅ Errores se manejan gracefully (sin console errors)  
✅ Feature flag permite habilitar/deshabilitar fácilmente  
✅ No hay cambios necesarios en servicios HTTP existentes  

---

## 📚 Referencias

- Mock Data: `src/app/shared/data/mock-data.ts`
- Interceptor: `src/app/shared/interceptors/mock-api.interceptor.ts`
- Quick Start: `MOCK_API_QUICK_START.md`
- Documentación completa: `DAY_3_MOCK_API_COMPLETE.md`

---

**Tiempo estimado:** 2-3 horas  
**Fecha de inicio:** 28 Enero 2026  
**Tester:** [Tu nombre]

---

*Actualizar este documento con resultados y problemas encontrados.*
