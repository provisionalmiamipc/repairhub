# 🚀 Guía de Testing Manual - Mock API Interceptor

## Status Actual
✅ **Mock API:** Habilitado en environment.ts  
✅ **Servidor:** Corriendo en http://localhost:4200  
✅ **Estado:** Listo para testing manual  

---

## 📍 Lo que Está Pasando Ahora

El `MockApiInterceptor` está activo y **interceptando TODOS los requests HTTP** a `http://localhost:3000/*`.

Cuando hagas:
```typescript
this.http.get('/api/users')
```

En lugar de ir al backend NestJS, el interceptor:
1. Detecta que es un request a `/api/users`
2. Llama a `getMockData('users')`
3. Retorna un array con 3 usuarios mock
4. Simula 500ms de latencia
5. Todo sin necesidad del backend

---

## 🧪 Pasos de Testing

### PASO 1️⃣: Verificar que el Mock API está activo

**En DevTools (F12):**
1. Abre DevTools → Pestaña **Console**
2. Escribe:
```javascript
fetch('/api/users').then(r => r.json()).then(d => console.log(d))
```
3. Deberías ver una respuesta como:
```json
{
  "data": [
    {
      "id": 1,
      "email": "juan@repairhub.com",
      "firstName": "Juan",
      "lastName": "García",
      ...
    },
    ...
  ],
  "total": 3,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

✅ **Si ves esto:** El Mock API está funcionando  
❌ **Si ves error:** El interceptor no está activo

---

### PASO 2️⃣: Verificar Feature Flag

**En DevTools → Console:**
```javascript
import { environment } from '/src/environments/environment';
console.log(environment.features.mockApi)  // Debería ser true
```

✅ Si es `true`: Está habilitado  
❌ Si es `false`: Cambiar en `src/environments/environment.ts`

---

### PASO 3️⃣: Probar GET con Paginación

**En DevTools → Console:**
```javascript
// GET con paginación
fetch('/api/users?page=1&pageSize=10')
  .then(r => r.json())
  .then(d => {
    console.log('Page:', d.page);
    console.log('PageSize:', d.pageSize);
    console.log('Total:', d.total);
    console.log('TotalPages:', d.totalPages);
    console.log('Data count:', d.data.length);
  })
```

**Esperado:**
```
Page: 1
PageSize: 10
Total: 3
TotalPages: 1
Data count: 3
```

---

### PASO 4️⃣: Probar GET por ID

**En DevTools → Console:**
```javascript
fetch('/api/users/1')
  .then(r => r.json())
  .then(d => {
    console.log('User encontrado:');
    console.log(d);
  })
```

**Esperado:** Un objeto con id=1

---

### PASO 5️⃣: Probar POST (Crear)

**En DevTools → Console:**
```javascript
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'testing@test.com',
    firstName: 'Test',
    lastName: 'User',
    isActive: true
  })
})
.then(r => r.json())
.then(d => {
  console.log('Nuevo usuario creado:');
  console.log('ID:', d.id);  // Debería ser > 3
  console.log('Email:', d.email);
})
```

**Esperado:**
- Status: 201
- `id` auto-generado (debería ser 4 o mayor)
- Todos los campos que enviaste

---

### PASO 6️⃣: Probar PUT (Actualizar)

**En DevTools → Console:**
```javascript
fetch('/api/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    email: 'juan.actualizado@repairhub.com',
    firstName: 'Juan Actualizado',
    lastName: 'García',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
})
.then(r => r.json())
.then(d => {
  console.log('Usuario actualizado:');
  console.log('Email nuevo:', d.email);
})
```

**Esperado:**
- Status: 200
- Campo `firstName` actualizado
- Campo `email` actualizado

---

### PASO 7️⃣: Probar DELETE

**En DevTools → Console:**
```javascript
fetch('/api/users/1', {
  method: 'DELETE'
})
.then(r => {
  console.log('Status:', r.status);  // Debería ser 204
  console.log('Eliminado correctamente');
})
```

**Esperado:**
- Status: 204 No Content
- No hay body en la respuesta

---

### PASO 8️⃣: Verificar Latencia Simulada

**En DevTools → Network tab:**
1. Abre Network tab (F12)
2. Haz un GET a `/api/users`
3. Observa el tiempo total:

**Esperado:**
- GET: ~500ms
- POST: ~600ms
- PUT: ~600ms
- DELETE: ~500ms

*(No debería ser instantáneo)*

---

## 🎯 Testing de Vistas (UI)

Si tu app tiene estas vistas, prueba:

### Usuarios:
1. `http://localhost:4200/admin/users` o similar
2. Verificar que:
   - [ ] La lista carga con 3 usuarios mock
   - [ ] Se ve la tabla con datos
   - [ ] Paginación funciona
   - [ ] Botones de editar/eliminar responden

### Clientes:
1. `http://localhost:4200/customers`
2. Verificar que:
   - [ ] La lista carga con 3 clientes
   - [ ] Se ven los campos: customerCode, firstName, lastName, email, phone
   - [ ] Búsqueda/filtrado funciona (si existe)

### Órdenes:
1. `http://localhost:4200/orders`
2. Verificar que:
   - [ ] La lista carga con 3 órdenes
   - [ ] Se ven montos (totalPrice, tax, advancePayment)
   - [ ] Búsqueda/filtrado funciona

### Dispositivos:
1. `http://localhost:4200/devices`
2. Verificar que:
   - [ ] La lista carga con 3 dispositivos
   - [ ] Se ven los datos correctamente

---

## 🐛 Si Encuentras Problemas

### Problema: Obtengo error 404
```
GET /api/users 404 Not Found
```

**Soluciones:**
1. Verifica que `mockApi: true` en `src/environments/environment.ts`
2. Reinicia el servidor `ng serve`
3. Refresca la página (Ctrl+Shift+R)
4. Verifica que la URL sea exacta `/api/users` (no `/api/users/` con slash final)

---

### Problema: Los datos no cambian después de crear
```
Cré un usuario pero no aparece en la lista
```

**Causa:** El Mock API mantiene los datos en memoria durante la sesión, pero:
- Si recargas la página, se pierden los cambios
- Esto es normal - es solo simulación

**Solución:** Refresca la página para ver que vuelven al estado inicial

---

### Problema: El servidor no carga
```
http://localhost:4200 no responde
```

**Soluciones:**
1. Verifica que `ng serve` está corriendo
2. Terminal debería mostrar: `✔ Compiled successfully` 
3. Intenta `ng serve --open` nuevamente
4. Limpia caché: `ng cache clean`

---

## 📊 Checklist Rápido

Marca cada uno que valides:

```
CORE FUNCTIONALITY
- [ ] GET lista retorna PagedResponse ✓
- [ ] GET por ID retorna entidad ✓
- [ ] POST crea nuevo registro ✓
- [ ] PUT actualiza registro ✓
- [ ] DELETE elimina registro ✓

PAGINATION
- [ ] Query param ?page=1 funciona ✓
- [ ] Query param ?pageSize=10 funciona ✓
- [ ] totalPages se calcula correctamente ✓

LATENCY
- [ ] GET tiene ~500ms latencia ✓
- [ ] POST tiene ~600ms latencia ✓
- [ ] PUT tiene ~600ms latencia ✓
- [ ] DELETE tiene ~500ms latencia ✓

UI INTEGRATION
- [ ] Listas cargan datos mock ✓
- [ ] Crear funciona ✓
- [ ] Editar funciona ✓
- [ ] Eliminar funciona ✓
- [ ] Búsqueda/filtrado funciona (si existe) ✓

ERROR HANDLING
- [ ] GET por ID inexistente retorna 404 ✓
- [ ] POST sin datos maneja error ✓
- [ ] PUT con ID inexistente falla gracefully ✓
```

---

## 💡 Tips Útiles

### 1. Ver todos los requests del mock API
En DevTools → Console:
```javascript
// Ver network requests en tiempo real
// DevTools → Network → filter by API XHR
```

### 2. Verificar datos mock disponibles
En DevTools → Console:
```javascript
// Ver qué datos hay disponibles
fetch('/api/items').then(r => r.json()).then(d => console.table(d.data))
fetch('/api/customers').then(r => r.json()).then(d => console.table(d.data))
fetch('/api/employees').then(r => r.json()).then(d => console.table(d.data))
```

### 3. Probar todas las entidades
```javascript
const endpoints = [
  'users', 'customers', 'employees', 'orders', 'devices', 
  'items', 'payment-types', 'device-brands', 'repair-status',
  'service-orders', 'inventory-movements', 'appointments'
];

for (const ep of endpoints) {
  fetch(`/api/${ep}`)
    .then(r => r.json())
    .then(d => console.log(`${ep}: ${d.data?.length || d.length} registros`))
}
```

---

## ❓ Próximos Pasos

Después de validar que todo funciona:

1. **Deshabilitar Mock API** y ver diferencias
2. **Documentar hallazgos** en MOCK_API_TESTING_RESULTS.md
3. **Revisar** si hay incompatibilidades con servicios existentes
4. **Considerar** agregar más datos mock si es necesario

---

## 🆘 Ayuda Rápida

**¿El Mock API no está funcionando?**

Verifica en orden:

1. ```bash
   # Está mockApi habilitado?
   grep "mockApi" src/environments/environment.ts | head -1
   ```

2. ```bash
   # Está el interceptor registrado?
   grep "MockApiInterceptor" src/app/app.config.ts
   ```

3. ```bash
   # Los archivos existen?
   ls -la src/app/shared/data/mock-data.ts
   ls -la src/app/shared/interceptors/mock-api.interceptor.ts
   ```

4. Refresca la página (Ctrl+Shift+R) para limpiar caché

---

## 📝 Documentación de Referencia

- **Quick Start:** MOCK_API_QUICK_START.md
- **Plan Completo:** MOCK_API_TESTING_PLAN.md
- **Documentación Técnica:** DAY_3_MOCK_API_COMPLETE.md

---

**¡Listo para testear!** Empieza por el PASO 1 y ve avanzando. 🚀
