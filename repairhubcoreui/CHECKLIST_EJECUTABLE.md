# ✅ CHECKLIST EJECUTABLE - ARQUITECTO RECOMENDACIONES

**Propósito:** Documento accionable, checkable, para implementación inmediata  
**Formato:** ✓ Checkbox + detalles técnicos  
**Tiempo:** 2 semanas (40-50 horas de desarrollo)  

---

## 🔴 SEMANA 1: CRITICAL INTEGRATION (LUNES-VIERNES)

### LUNES: DESHABILITAR MOCK API (Tarea 1.1)

**Objetivo:** API real funciona, MockApi solo en DEV

```
TAREAS:
□ Leer ARQUITECTO_ANALISIS_COMPLETO.md sección "Tarea 1.1"
□ Revisar src/app/app.config.ts líneas 25-65
□ Revisar src/environments/environment.ts
□ Revisar src/environment.prod.ts

IMPLEMENTACIÓN:
□ Crear rama: git checkout -b feature/api-integration

□ Modificar src/app/app.config.ts:
  OLD:
  providers.push({
    provide: HTTP_INTERCEPTORS,
    useClass: MockApiInterceptor,
    multi: true
  });

  NEW:
  const mockApiEnabled = !environment.production && 
                        environment.features.mockApi;
  if (mockApiEnabled) {
    providers.push({
      provide: HTTP_INTERCEPTORS,
      useClass: MockApiInterceptor,
      multi: true
    });
  }

□ Actualizar src/environments/environment.ts:
  features: {
    mockApi: true  // ← Solo en DEV
  }

□ Actualizar src/environment.prod.ts:
  features: {
    mockApi: false // ← Nunca en PROD
  }

TESTING:
□ npm run build   → Compilación sin errores
□ Abrir application en http://localhost:4200
□ F12 Network tab → Ver requests a http://localhost:3000
□ Verificar backend NestJS responde en puerto 3000
□ Testar 5 requests diferentes (users, orders, etc)
□ Verificar response structure matches con mock data

GIT:
□ git add -A
□ git commit -m "feat: disable mock API, use real API"
□ Hacer PR para code review
□ Merge a main cuando pasa review

⏱️ TIEMPO ESTIMADO: 2 horas
✅ RESULTADO: API real funciona
```

---

### MARTES-MIÉRCOLES: STATE PERSISTENCE (Tarea 1.2)

**Objetivo:** AppStateService guardar y restaurar estado

```
TAREAS:
□ Leer ARQUITECTO_ANALISIS_COMPLETO.md sección "Tarea 1.2"
□ Leer RECOMENDACIONES_TECNICAS.md sección "2.1"

CREAR SESIÓN STORAGE SERVICE:
□ Crear: src/app/shared/services/session-storage.service.ts

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error(`Storage full: ${key}`, e);
    }
  }

  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error(`Storage error: ${key}`, e);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Storage error removing: ${key}`, e);
    }
  }

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error('Storage clear error', e);
    }
  }
}
```

CREAR APP STATE SERVICE:
□ Crear: src/app/shared/services/app-state.service.ts

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/User';
import { Center } from '../models/Center';
import { Store } from '../models/Store';

export interface AppState {
  currentUser: User | null;
  currentCenter: Center | null;
  currentStore: Store | null;
  lastAccessedModule: string | null;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

const INITIAL_STATE: AppState = {
  currentUser: null,
  currentCenter: null,
  currentStore: null,
  lastAccessedModule: null,
  theme: 'light',
  sidebarCollapsed: false
};

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private readonly state$ = new BehaviorSubject<AppState>(this.loadState());

  // Public observables
  currentUser$ = this.state$.pipe(map(s => s.currentUser));
  currentCenter$ = this.state$.pipe(map(s => s.currentCenter));
  currentStore$ = this.state$.pipe(map(s => s.currentStore));
  lastAccessedModule$ = this.state$.pipe(map(s => s.lastAccessedModule));
  theme$ = this.state$.pipe(map(s => s.theme));
  sidebarCollapsed$ = this.state$.pipe(map(s => s.sidebarCollapsed));

  constructor(private storage: SessionStorageService) {
    this.state$.subscribe(state => this.persistState(state));
  }

  setCurrentUser(user: User | null): void {
    this.updateState({ currentUser: user });
  }

  setCurrentCenter(center: Center | null): void {
    this.updateState({ currentCenter: center });
  }

  setCurrentStore(store: Store | null): void {
    this.updateState({ currentStore: store });
  }

  setLastAccessedModule(module: string | null): void {
    this.updateState({ lastAccessedModule: module });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
  }

  toggleSidebar(): void {
    const current = this.state$.value;
    this.updateState({ sidebarCollapsed: !current.sidebarCollapsed });
  }

  clear(): void {
    this.state$.next(INITIAL_STATE);
    this.storage.removeItem('appState');
  }

  private updateState(partial: Partial<AppState>): void {
    const current = this.state$.value;
    this.state$.next({ ...current, ...partial });
  }

  private loadState(): AppState {
    const persisted = this.storage.getItem('appState');
    return persisted ? JSON.parse(persisted) : INITIAL_STATE;
  }

  private persistState(state: AppState): void {
    this.storage.setItem('appState', JSON.stringify(state));
  }
}
```

INTEGRAR EN COMPONENTES:
□ Actualizar app.component.ts:
  - Inyectar AppStateService
  - En ngOnInit: restaurar estado guardado
  - En ngOnDestroy: guardar estado

□ Actualizar sidebar component:
  - Toggle sidebar usa AppStateService
  - Navegar a módulo → setLastAccessedModule

□ Actualizar auth component:
  - Login: setCurrentUser
  - Logout: clear()

TESTING:
□ npm run build   → 0 errores
□ Abrir en navegador
□ Cambiar configuración (tema, sidebar)
□ F5 (refresh)
□ Verificar que configuración se mantiene ✓
□ Logout → verificar estado se limpia ✓

⏱️ TIEMPO ESTIMADO: 2 horas
✅ RESULTADO: Estado persiste en F5
```

---

### JUEVES: CACHE MANAGER (Tarea 1.3)

**Objetivo:** Implementar caché inteligente con TTL

```
CREAR CACHE MANAGER SERVICE:
□ Crear: src/app/shared/services/cache-manager.service.ts

```typescript
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({ providedIn: 'root' })
export class CacheManagerService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  get<T>(
    key: string,
    fetcher: () => Observable<T>,
    ttl: number = this.defaultTTL
  ): Observable<T> {
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      console.log(`[Cache HIT] ${key}`);
      return of(cached.data as T);
    }

    console.log(`[Cache MISS] ${key}`);
    return fetcher().pipe(
      tap(data => {
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        });
      })
    );
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`[Cache INVALIDATE] ${key}`);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    Array.from(this.cache.keys())
      .filter(key => regex.test(key))
      .forEach(key => this.cache.delete(key));
    console.log(`[Cache INVALIDATE PATTERN] ${pattern}`);
  }

  clear(): void {
    this.cache.clear();
    console.log('[Cache CLEAR]');
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
}
```

INTEGRAR EN BASESERVICE:
□ Modificar src/app/shared/services/base.service.ts:
  - Inyectar CacheManagerService
  - Usar cache en getAll()
  - Invalidar en create/update/delete

```typescript
export class BaseService<T> {
  constructor(
    protected http: HttpClient,
    protected cacheManager: CacheManagerService
  ) {}

  getAll(ttl = 5 * 60 * 1000): Observable<T[]> {
    const cacheKey = `${this.endpoint}:all`;
    return this.cacheManager.get(
      cacheKey,
      () => this.http.get<T[]>(this.endpoint),
      ttl
    );
  }

  create(item: Partial<T>): Observable<T> {
    return this.http.post<T>(this.endpoint, item).pipe(
      tap(() => {
        this.cacheManager.invalidatePattern(`${this.endpoint}:.*`);
      })
    );
  }

  update(id: number, item: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.endpoint}/${id}`, item).pipe(
      tap(() => {
        this.cacheManager.invalidate(`${this.endpoint}:${id}`);
        this.cacheManager.invalidatePattern(`${this.endpoint}:all`);
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => {
        this.cacheManager.invalidate(`${this.endpoint}:${id}`);
        this.cacheManager.invalidatePattern(`${this.endpoint}:all`);
      })
    );
  }
}
```

TESTING:
□ npm run build   → 0 errores
□ F12 Network tab
□ Cargar lista de usuarios → 1 request
□ Ir a otro módulo y volver → 0 requests (desde cache)
□ Esperar 5 minutos → siguiente click = new request
□ Crear/actualizar usuario → cache invalidado
□ Verificar cache stats en console

⏱️ TIEMPO ESTIMADO: 2 horas
✅ RESULTADO: -40% requests, +30% performance
```

---

### VIERNES: FINALES + CRUD 70% (Tareas 1.4 & 1.5)

```
TAREA 1.4: SESSION STORAGE EDGE CASES
□ Implementar manejo de quota exceeded
□ Implementar fallback a memory si localStorage falla
□ Agregar cleanup de datos antiguos
□ Tests para edge cases

TESTING 1.4:
□ Simular storage quota exceeded
□ Verificar fallback funciona
□ Verificar cleanup se ejecuta

TAREA 1.5: MODERNIZAR CRUDS A 70%
Priorizar estos módulos (20 min c/u):
□ PaymentTypes (1-step: name + type)
□ RepairStatus (1-step: name + color)
□ ItemTypes (1-step: name + description)
□ ServiceTypes (1-step: name + description)

Pasos para cada módulo:
□ Crear [module]-list-modern.component.ts/html/scss
□ Crear [module]-form-modern.component.ts/html/scss
□ Actualizar app.routes.ts
□ npm run build
□ Verificar 0 errores

RESULTADO VIERNES:
□ MockApi deshabilitado ✅
□ AppStateService en production ✅
□ CacheManager en production ✅
□ 70% CRUDs modernos ✅
□ 0 errores de compilación ✅
□ Merge a main ✅

⏱️ TOTAL SEMANA 1: 20-22 horas
```

---

## 🟠 SEMANA 2: CONSOLIDATION (LUNES-VIERNES)

### LUNES-MIÉRCOLES: BACKEND TESTING (Tarea 2.1)

**Objetivo:** 50% unit tests en servicios backend

```
CREAR TESTS PARA 5 SERVICIOS:
□ users.service.spec.ts (20 tests)
□ auth.service.spec.ts (20 tests)
□ centers.service.spec.ts (15 tests)
□ orders.service.spec.ts (15 tests)
□ employees.service.spec.ts (15 tests)

TEMPLATE PARA CADA SERVICE:
□ Copy test structure desde RECOMENDACIONES_TECNICAS.md
□ Mock Repository (TypeORM)
□ Mock JWT guard
□ Test: find all, find one, create, update, delete
□ Test: error handling
□ Test: validation

RUNNING TESTS:
□ cd repairhub-api
□ npm test                  → Run all tests
□ npm run test:cov         → Coverage report
□ Target: 50% coverage

⏱️ TIEMPO ESTIMADO: 6 horas
✅ RESULTADO: 50% tests backend
```

---

### JUEVES: E2E TESTS BÁSICOS (Tarea 2.2)

**Objetivo:** 20+ E2E tests con Cypress

```
SETUP CYPRESS:
□ npm install --save-dev cypress
□ npx cypress open
□ Crear 📁 cypress/e2e/

CREAR E2E TESTS:
□ cypress/e2e/auth.cy.ts (5 tests)
□ cypress/e2e/orders.cy.ts (5 tests)
□ cypress/e2e/users.cy.ts (5 tests)
□ cypress/e2e/centers.cy.ts (5 tests)

TESTS POR MÓDULO:
□ List view loads
□ Create item
□ Edit item
□ Delete item
□ Search/filter works

RUNNING E2E:
□ npm run ng serve   (terminal 1)
□ npx cypress run    (terminal 2)
□ Verificar todos pasan ✓

⏱️ TIEMPO ESTIMADO: 3 horas
✅ RESULTADO: 20+ E2E tests
```

---

### VIERNES: OPTIMIZATION + 100% CRUDs (Tareas 2.3-2.4)

```
TAREA 2.3: QUERY OPTIMIZATION
□ Revisar todos los findAll() en backend
□ Agregar eager loading para relations
□ Agregar select fields específicos
□ Agregar pagination (20 items/página)
□ Test: Query performance mejorada

TAREA 2.4: GLOBAL ERROR HANDLER
□ Crear src/common/exceptions/global-exception.filter.ts
□ Registrar en app.module.ts
□ Test: Errores retornan formato estándar
□ Test: Stack trace oculto en production

TAREA 1.5 CONTINUACIÓN: 100% CRUDs
Modernizar últimos 7 módulos (45 min c/u):
□ SO Diagnostics
□ SO Items
□ SO Notes
□ InventoryMovements (complex, 1.5h)
□ Otros...

FINAL CHECKS:
□ npm run build        → 0 errores
□ npm test             → All tests pass
□ npm run test:e2e     → All E2E pass
□ git push a main
□ Create release candidate

⏱️ TOTAL SEMANA 2: 20-22 horas
```

---

## 🎯 VERIFICATION CHECKLIST

### AFTER SEMANA 1:
```
FUNCIONALIDAD:
□ API requests van realmente a localhost:3000
□ localStorage contiene appState
□ F5 restaura usuario/centro/configuración
□ Cache reduce requests (verificar network tab)
□ 70% CRUDs funcionales (18/25)

BUILD:
□ npm run build → 0 errores
□ npm run build → 0 warnings (o deprecation warnings OK)
□ Tiempo build < 20 segundos

TESTS:
□ npm test → 183 tests pasando
□ No hay test failures nuevas

STAGING:
□ Mergeable a main
□ Code review passed
□ Ready para semana 2
```

### AFTER SEMANA 2:
```
FUNCIONALIDAD:
□ 100% CRUDs modernos (25/25)
□ Backend tests: 50% coverage
□ E2E tests: 20+ tests
□ Performance: Load time < 2s
□ Cache hit rate > 60%

BUILD:
□ npm run build → 0 errores
□ npm run build → 0 warnings nuevas

TESTS:
□ npm test → 183+ frontend tests passing
□ npm test (backend) → 50+ tests passing
□ npx cypress run → 20+ E2E passing

PRODUCTION READY:
□ Staging environment funcional
□ Zero critical bugs
□ Documentation updated
□ Team trained on changes
□ Ready para production deployment
```

---

## 📊 TRACKING SHEET

```
┌─────────────────────────────────────────────────────────┐
│                    WEEK 1 PROGRESS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  LUNES:    Tarea 1.1 (MockApi)         □ PENDIENTE    │
│  MARTES:   Tarea 1.2 (AppState)        □ PENDIENTE    │
│  MIÉRCOLES: Tarea 1.2 (AppState) cont  □ PENDIENTE    │
│  JUEVES:   Tarea 1.3 (Cache)           □ PENDIENTE    │
│  VIERNES:  Tarea 1.4 + 1.5 (70% CRUDs) □ PENDIENTE    │
│                                                         │
│  SEMANA 1 STATUS: ░░░░░░░░░░ 0%                      │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    WEEK 2 PROGRESS                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  LUNES:    Tarea 2.1 (Backend Tests)   □ PENDIENTE    │
│  MARTES:   Tarea 2.1 (Backend Tests) ct □ PENDIENTE    │
│  MIÉRCOLES: Tarea 2.1 (Backend Tests) ct □ PENDIENTE    │
│  JUEVES:   Tarea 2.2 (E2E Tests)       □ PENDIENTE    │
│  VIERNES:  Tarea 2.3 + 2.4 + 100% CRUDs □ PENDIENTE    │
│                                                         │
│  SEMANA 2 STATUS: ░░░░░░░░░░ 0%                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📞 TROUBLESHOOTING

### Problema: MockApi aún intercepta requests
```
Solución:
1. Verificar environment.production está correcto
2. Verificar import environment está en lugar correcto
3. Verificar MockApiInterceptor está dentro de if (mockApiEnabled)
4. Restart ng serve
5. Clear browser cache
```

### Problema: localStorage no persiste
```
Solución:
1. Verificar SessionStorageService implementada
2. Verificar AppStateService inyectado en AppComponent
3. Check browser localStorage quota
4. Verificar JSON.stringify/parse funciona
5. Check browser console para errores
```

### Problema: Cache no funciona
```
Solución:
1. Verificar CacheManagerService inyectado en BaseService
2. Verificar BaseService.getAll() usa cache
3. Verificar invalidate() se llama en create/update/delete
4. Check Network tab → debe haber cache HIT
5. Verificar TTL no está expirado
```

### Problema: Tests fallan
```
Solución:
1. Correr: npm test -- --watch
2. Revisar error messages
3. Verificar mocks están correctos
4. Verificar imports correctos
5. Clear node_modules: rm -rf node_modules && npm install
```

---

## ✅ FINAL DELIVERY

```
SEMANA 2 VIERNES:
□ Todos los tests pasando
□ 0 errores de compilación
□ 100% CRUDs modernizados
□ API integrada realmente
□ State persiste en localStorage
□ Caché funcional
□ Backend tests 50%
□ E2E tests básicos
□ Documentación actualizada
□ Team entrenado

RESULTADO:
✅ Aplicación production-ready
✅ Calificación: 8.5/10
✅ Listo para staging/production

SIGUIENTE PASO:
→ Deploy a staging environment
→ User acceptance testing
→ Feedback cycle
→ Production deployment
```

---

**Este checklist es tu mapa de ruta para los próximos 2 semanas.**

**Úsalo para tracking, para sprints, para comunicación con el equipo.**

**¡Adelante! 🚀**
