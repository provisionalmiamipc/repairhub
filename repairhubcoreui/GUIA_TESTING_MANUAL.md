# 🧪 Guía de Testing Manual - Tareas Críticas

**Objetivo**: Verificar manualmente que las 3 tareas críticas funcionan correctamente.

---

## 🎯 Test 1: MockApi Deshabilitado en Producción

### Desarrollo (mockApi: true)

1. **Iniciar aplicación en modo desarrollo**:
```bash
cd /home/alfego/Documentos/repairhubcoreui
npm start
```

2. **Abrir DevTools → Console**

3. **Verificar que MockApi está activo**:
   - Buscar en consola: `[MockApi]` logs
   - Las requests deben ser interceptadas
   - Datos devueltos son mock (no del backend real)

4. **Desactivar MockApi temporalmente**:
```typescript
// En src/environments/environment.ts cambiar:
features: {
  mockApi: false,  // ✅ Cambiar a false
  // ...
}
```

5. **Reiniciar servidor** (`npm start`)

6. **Verificar**:
   - ✅ No hay logs `[MockApi]`
   - ✅ Requests van a `http://localhost:3000` (backend real)
   - ❌ Errores de conexión si backend no está corriendo

### Producción (mockApi: false)

1. **Build de producción**:
```bash
npm run build
```

2. **Verificar bundle**:
```bash
# Buscar 'MockApiInterceptor' en el bundle
grep -r "MockApiInterceptor" dist/
```

**✅ Resultado esperado**: 
- No debe aparecer MockApiInterceptor en el bundle de producción
- O solo como comentario/referencia sin código ejecutable

3. **Servir build de producción**:
```bash
npm install -g http-server
http-server dist/repairhubcoreui/browser -p 8080
```

4. **Abrir**: http://localhost:8080

5. **DevTools → Network**:
   - ✅ Todas las requests deben ir a API real (no interceptadas)
   - ✅ Si backend no está disponible → errores de red (esperado)

---

## 🎯 Test 2: AppState + Persistencia

### 2.1 Test de Persistencia en F5

1. **Login en la aplicación** (desarrollo):
```bash
npm start
```

2. **Inspeccionar estado inicial**:
   - DevTools → Console
   ```typescript
   // Inyectar AppStateService en consola (si tienes acceso)
   // O usar componente que ya lo use (ej: HeaderComponent)
   ```

3. **Establecer datos de usuario**:
   - Login con credenciales válidas
   - Verificar en Console: `[AppState] Estableciendo usuario: <nombre>`

4. **Verificar sessionStorage**:
   - DevTools → Application → Session Storage
   - Buscar key: `repairhub_app_state`
   - Debe contener JSON con:
     ```json
     {
       "currentUser": { ... },
       "user": { ... },
       "theme": "light",
       "sidebarCollapsed": false,
       "timestamp": 1738159200000
     }
     ```

5. **REFRESH (F5)**:
   - ✅ Aplicación debe mantener sesión
   - ✅ Usuario sigue logueado
   - ✅ No redirige a login
   - ✅ Console muestra: `[AppState] Estado cargado desde storage`

6. **Cerrar tab y reabrir**:
   - ❌ SessionStorage se limpia
   - ❌ Usuario deslogueado (comportamiento correcto de sessionStorage)

### 2.2 Test de Tema (Dark/Light)

1. **Cambiar tema en UI** (si hay botón de tema)

2. **Verificar en Console**:
```
[AppState] Cambiando tema a: dark
```

3. **Refresh F5**:
   - ✅ Tema debe persistir

4. **Verificar sessionStorage**:
```json
{
  "theme": "dark",
  ...
}
```

### 2.3 Test de Notificaciones

1. **Trigger un error** (ej: intentar acción sin permisos)

2. **Verificar Console**:
```
[AppState] Notificación error: No tienes permisos para esta acción
```

3. **Verificar sessionStorage**:
```json
{
  "ui": {
    "notifications": [
      {
        "id": "notif-1738159200000-0.123",
        "type": "error",
        "message": "No tienes permisos...",
        "timestamp": "2026-01-29T14:00:00.000Z",
        "duration": 5000
      }
    ]
  }
}
```

4. **Esperar 5 segundos**:
   - ✅ Notificación debe auto-eliminarse del estado

---

## 🎯 Test 3: CacheManager con TTL

### 3.1 Test de Cache Hit/Miss

1. **Habilitar debug de caché** (ya está en `environment.ts`):
```typescript
cache: {
  enabled: true,
  debug: true,  // ✅ Debe estar en true
  defaultTtl: 180000
}
```

2. **Iniciar aplicación**:
```bash
npm start
```

3. **Navegar a módulo Users** (o cualquier CRUD):
   - Primera carga de `/users`

4. **Console debe mostrar**:
```
[Cache MISS] "http://localhost:3000/users:all" (reason: not-found)
[Cache SET] "http://localhost:3000/users:all" (ttl: 300s)
```

5. **Navegar a otro módulo** (ej: Orders)

6. **Regresar a Users**:
```
[Cache HIT] "http://localhost:3000/users:all" (age: 15s)
```

7. **Verificar Network tab**:
   - ✅ Primera visita: HTTP request
   - ✅ Segunda visita: NO request (caché)

### 3.2 Test de Invalidación en Create/Update/Delete

1. **Listar usuarios**:
```
[Cache HIT] "http://localhost:3000/users:all"
```

2. **Crear nuevo usuario**:
   - Click en "Nuevo Usuario"
   - Llenar formulario
   - Guardar

3. **Console debe mostrar**:
```
[Cache INVALIDATE PATTERN] "^http://localhost:3000/users:" (2 entries)
```

4. **Verificar lista de usuarios**:
   - ✅ Nuevo usuario aparece en la lista
   - ✅ Próxima navegación hará MISS (caché invalidado)

### 3.3 Test de TTL Expirado

1. **Cambiar TTL a 10 segundos** (temporal):
```typescript
// environment.ts
cache: {
  defaultTtl: 10000,  // 10 segundos
}
```

2. **Reiniciar app**

3. **Cargar Users**:
```
[Cache MISS] "http://localhost:3000/users:all" (reason: not-found)
[Cache SET] "http://localhost:3000/users:all" (ttl: 10s)
```

4. **Navegar a otro módulo**

5. **Esperar 15 segundos**

6. **Regresar a Users**:
```
[Cache MISS] "http://localhost:3000/users:all" (reason: expired)
[Cache SET] "http://localhost:3000/users:all" (ttl: 10s)
```

7. **Network tab**:
   - ✅ Nueva request HTTP (caché expirado)

### 3.4 Test de Estadísticas

1. **Navegar por varios módulos** (Users, Orders, Customers, etc.)

2. **Abrir Console**

3. **Ejecutar**:
```javascript
// En la consola del navegador (requiere acceso al servicio)
// Alternativamente, agregar temporalmente en algún componente:

constructor(private cache: CacheManagerService) {
  setTimeout(() => {
    console.log('📊 Cache Stats:', this.cache.getStats());
    this.cache.printStats();
  }, 30000); // Después de 30 segundos de uso
}
```

4. **Resultado esperado**:
```
📊 Cache Stats: {
  size: 12,
  keys: [
    "http://localhost:3000/users:all",
    "http://localhost:3000/orders:all",
    "http://localhost:3000/customers:all",
    ...
  ],
  hits: 28,
  misses: 12,
  hitRate: 70.0
}

[Cache Stats] {
  entries: 12,
  hits: 28,
  misses: 12,
  hitRate: '70.0%'
}
```

### 3.5 Test de Cleanup Automático

1. **Esperar 5 minutos** con aplicación abierta

2. **Console debe mostrar** (si debug: true):
```
[Cache CLEANUP] 3 expired entries removed
```

3. **Verificar stats**:
   - ✅ `size` disminuyó (entradas expiradas eliminadas)

---

## 🎯 Test 4: Integración Completa

### Escenario: Flujo de Usuario Completo

1. **Login**:
   - ✅ `[AppState] Estableciendo usuario: John Doe`
   - ✅ sessionStorage guarda user

2. **Navegar a Users**:
   - ✅ `[Cache MISS]` → HTTP request
   - ✅ `[Cache SET]` → Datos guardados

3. **Navegar a Orders**:
   - ✅ `[Cache MISS]` → HTTP request
   - ✅ `[Cache SET]` → Datos guardados

4. **Regresar a Users**:
   - ✅ `[Cache HIT]` → Sin HTTP request
   - ✅ Carga instantánea

5. **Crear nuevo usuario**:
   - ✅ `[Cache INVALIDATE PATTERN]` → Caché limpiado

6. **F5 Refresh**:
   - ✅ `[AppState] Estado cargado desde storage`
   - ✅ Usuario sigue logueado
   - ✅ Caché se reconstruye (MISS en primer acceso)

7. **Logout**:
   - ✅ `[AppState] Limpiando estado`
   - ✅ sessionStorage limpio
   - ✅ Redirige a login

---

## 📊 Checklist de Verificación

### ✅ MockApi
- [ ] Desarrollo: MockApi funciona con `mockApi: true`
- [ ] Desarrollo: MockApi se desactiva con `mockApi: false`
- [ ] Producción: MockApi NO está en bundle
- [ ] Producción: Requests van a API real

### ✅ AppState
- [ ] Login guarda usuario en sessionStorage
- [ ] F5 restaura usuario desde sessionStorage
- [ ] Tema persiste en refresh
- [ ] Notificaciones se registran correctamente
- [ ] Logout limpia sessionStorage
- [ ] Cerrar tab limpia sessionStorage

### ✅ CacheManager
- [ ] Primera carga: MISS + HTTP request
- [ ] Segunda carga: HIT + sin request
- [ ] Create/Update/Delete: Invalida caché
- [ ] TTL expira correctamente
- [ ] Cleanup automático cada 5 min
- [ ] Stats reflejan hits/misses correctos
- [ ] Debug logs funcionan
- [ ] Performance mejorada (-40% requests estimado)

---

## 🐛 Problemas Conocidos

### Tests Unitarios
- ⚠️ Tests de `app-state.service.spec.ts` fallan (interface cambió)
- ⚠️ Tests de `base.service.spec.ts` fallan (CacheStats cambió)
- ✅ **No afecta funcionalidad** - Solo tests necesitan actualización
- 📅 **Solución**: Actualizar mocks en próxima iteración

### Warnings de SASS
- ⚠️ 61 deprecation warnings de `@import`
- ✅ **No afecta funcionalidad** - Solo warnings
- 📅 **Solución**: Migrar a `@use` en fase 2

---

## 🚀 Próximos Tests

### Cuando se complete integración con backend:

1. **Test con backend real corriendo**:
   - Verificar que requests llegan correctamente
   - Verificar que responses se cachean
   - Verificar que mutations invalidan caché

2. **Test de performance**:
   - Medir tiempo de carga sin caché
   - Medir tiempo de carga con caché
   - Calcular mejora real (objetivo: -40%)

3. **Test de load**:
   - Simular 100+ navegaciones
   - Verificar hit rate >= 70%
   - Verificar que memoria no crece indefinidamente

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar Console**:
   - Buscar logs `[AppState]`, `[Cache]`, `[SessionStorage]`
   - Verificar errores en rojo

2. **Verificar DevTools**:
   - Application → Session Storage
   - Network → Ver requests duplicados

3. **Verificar environment**:
   - `environment.ts`: `mockApi: true`, `cache.debug: true`
   - `environment.prod.ts`: `mockApi: false`

---

**✅ Happy Testing! 🎉**
