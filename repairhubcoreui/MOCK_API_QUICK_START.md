# 🚀 Quick Start: Mock API Interceptor

## ¿Qué es?
Un **interceptor HTTP** que devuelve datos mock realistas cuando está habilitado, permitiendo desarrollo sin backend.

## ✅ Habilitar Mock API (2 segundos)

Abre `src/environments/environment.ts` y cambia:

```typescript
export const environment = {
  // ... otros settings ...
  features: {
    mockApi: true  // ← Cambiar de false a true
  }
};
```

**¡Eso es todo!** Todos los requests HTTP ahora retornan datos mock.

---

## 📝 Ejemplos de Uso

### GET (Listar usuarios)
```typescript
this.http.get('/api/users').subscribe(response => {
  console.log(response.data);      // Array de 3 usuarios mock
  console.log(response.total);     // 3
  console.log(response.page);      // 1
  console.log(response.pageSize);  // 20
});
```

### GET con Paginación
```typescript
this.http.get('/api/users?page=1&pageSize=10').subscribe(response => {
  // response.pageSize = 10
  // response.totalPages = 1 (porque total es 3)
});
```

### GET por ID
```typescript
this.http.get('/api/users/1').subscribe(user => {
  console.log(user.email); // Retorna un usuario específico
});
```

### POST (Crear)
```typescript
this.http.post('/api/users', {
  email: 'nuevo@test.com',
  firstName: 'Juan',
  lastName: 'García',
  isActive: true
}).subscribe(newUser => {
  console.log(newUser.id); // ID generado automáticamente
});
```

### PUT (Actualizar)
```typescript
this.http.put('/api/users/1', {
  firstName: 'Actualizado'
}).subscribe(updated => {
  console.log(updated.firstName); // 'Actualizado'
});
```

### DELETE
```typescript
this.http.delete('/api/users/1').subscribe(() => {
  console.log('Usuario eliminado');
});
```

---

## 📚 Entidades Disponibles

Todas estas retornan datos mock:
- `/api/users`
- `/api/customers`
- `/api/employees`
- `/api/orders`
- `/api/devices`
- `/api/items`
- `/api/payment-types`
- `/api/device-brands`
- `/api/repair-status`
- `/api/service-orders`
- `/api/inventory-movements`
- `/api/appointments`
- `/api/item-types`
- `/api/service-types`
- `/api/stores`
- `/api/centers`

---

## ⚡ Características

✅ **Latencia simulada:** 500-600ms (realista)  
✅ **Paginación:** Soporte completo con query params  
✅ **CRUD Completo:** GET, POST, PUT, DELETE  
✅ **Generación automática de IDs:** POST genera IDs nuevos  
✅ **Feature Flag:** Fácil de habilitar/deshabilitar  
✅ **Transparente:** No requiere cambios en código existente  

---

## 🔍 Estructura de Datos Mock

Cada entidad tiene 2-5 registros realistas:

```typescript
// Ejemplo: Usuario
{
  id: 1,
  email: 'juan@repairhub.com',
  firstName: 'Juan',
  lastName: 'García',
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}

// Ejemplo: Orden
{
  id: 1,
  totalPrice: 150.00,
  tax: 15.00,
  advancePayment: 50.00,
  note: 'Reparación de pantalla',
  cloused: false,
  canceled: false
}
```

---

## 🛠️ Deshabilitar Mock API

Abre `src/environments/environment.ts` y cambia:

```typescript
features: {
  mockApi: false  // ← Vuelve a usar API real
}
```

Así de simple - tu código no necesita cambios.

---

## 📂 Archivos del Sistema

- `src/app/shared/data/mock-data.ts` - Datos mock (500+ LOC)
- `src/app/shared/interceptors/mock-api.interceptor.ts` - Lógica HTTP (380+ LOC)
- `src/app/shared/interceptors/mock-api.interceptor.spec.ts` - Tests (280+ LOC)

---

## 🧪 Tests

```bash
npm test -- --watch=false --code-coverage=false --browsers=ChromeHeadless
```

Resultado: **266/266 tests pasando** ✅

---

## 💡 Tips

1. **Ver requests en consola:** Habilita `environment.cache.debug = true`
2. **Agregar más datos:** Edita `mock-data.ts` y agrega registros a los arrays
3. **Agregar nuevas entidades:** Copia el patrón de entidades existentes en `mock-data.ts`
4. **Testing:** Con mock API habilitado, prueba todas tus vistas sin backend

---

## ❓ Preguntas Frecuentes

**P: ¿El mock API funciona en producción?**  
R: No, porque `environment.features.mockApi` es `false` en producción.

**P: ¿Puedo tener diferentes datos mock para diferentes usuarios?**  
R: Actualmente no, pero es fácil de agregar modificando `mock-data.ts`.

**P: ¿Qué pasa si llamo a un endpoint que no existe?**  
R: Retorna un array vacío o undefined (depende de si es GET con ID o sin ID).

**P: ¿Cómo agrego más registros de datos?**  
R: Edita los arrays en `src/app/shared/data/mock-data.ts` (ej: `MOCK_USERS`, `MOCK_CUSTOMERS`).

---

## 📊 Resumen

| Concepto | Valor |
|----------|-------|
| Archivos creados | 3 |
| Líneas de código | ~1,160 |
| Tests | 266 (todos pasando) |
| Entidades mock | 16 |
| Registros por entidad | 2-5 |
| Latencia simulada | 500-600ms |
| Feature flag | ✅ Fácil de usar |

---

**¡Listo para desarrollar offline!** 🎉

*Más info en: [DAY_3_MOCK_API_COMPLETE.md](DAY_3_MOCK_API_COMPLETE.md)*
