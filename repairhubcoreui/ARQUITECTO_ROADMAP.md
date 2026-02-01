# 🏗️ ARQUITECTO SOFTWARE ROADMAP - RepairHub

**Fecha:** 27 Enero 2026  
**Versión:** 2.1.0-hito2  
**Estado:** ✅ Línea base estable - Listo para Phase 3  
**Estilo:** Extreme Programming (XP) + Agile Manifesto 2026  

---

## 📋 EXECUTIVE SUMMARY

Tu proyecto está en **excelente estado arquitectónico**. Tienes:
- ✅ 183 tests pasando (estable)
- ✅ 0 errores TypeScript/compilación
- ✅ BaseService pattern robusto para 15+ servicios
- ✅ Smart/Dumb components bien separados
- ✅ RBAC completamente implementado
- ✅ 25 módulos de features funcionales

**GAP CRÍTICO IDENTIFICADO:**
- ❌ Falta **integración real API** - Todo está en cliente
- ❌ Falta **persistencia de estado** (localStorage/session)
- ❌ Falta **caché inteligente** con invalidación
- ❌ Falta **optimización de queries** (GraphQL ready?)
- ❌ Falta **manejo de offlinemode** básico

---

## 🎯 FASE 3: INTEGRACIÓN & OPTIMIZACIÓN (8 semanas)

### SEMANA 1-2: Estado Global & Persistencia

#### 1️⃣ Implementar NgRx Lite (No overengineering)
```typescript
// ❌ EVITAR: Full NgRx (overkill para este proyecto)
// ✅ USAR: Minimal state con BehaviorSubject + LocalStorage

// 📁 src/app/shared/store/
//   ├── app-state.service.ts (singleton state container)
//   ├── state-persistence.service.ts (localStorage wrapper)
//   └── cache-manager.service.ts (smart caching)
```

**Acción Inmediata:**
```bash
# Crear servicio de estado global mínimal
```

#### 2️⃣ Persistencia de Sesión
```typescript
// UserSessionService
// - Guardar usuario actual
// - Guardar último acceso a módulo
// - Guardar filtros aplicados
// - Auto-logout después de 30 min inactividad
```

#### 3️⃣ Smart Caching Strategy
```typescript
// Implementar en BaseService:
// - Cache by TTL (Time To Live)
// - Invalidation triggers
// - Offline-first reading
```

**Deliverable:** Tests para caché + Persistencia funcionando

---

### SEMANA 3-4: API Real Integration

#### 1️⃣ Actualizar environment.ts
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  timeout: 30000,
  cacheExpiry: 5 * 60 * 1000, // 5 min
  retryAttempts: 3,
  offlineModeEnabled: true
};
```

#### 2️⃣ Interceptor de HTTP + Error Handling
```typescript
// httpconfig.interceptor.ts
// - Inyectar token JWT automáticamente
// - Manejar 401/403 (refresh token)
// - Retry automático en 5xx
// - Transform API responses
// - Timeout handling global
```

#### 3️⃣ API Error Standardization
```typescript
// shared/models/api-error.model.ts
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: { [key: string]: string[] };
  timestamp: string;
  path: string;
}

// BaseService debe manejar esto
```

**Test:** E2E con api real en localhost

---

### SEMANA 5: Query Optimization & Performance

#### 1️⃣ Lazy Loading Optimization
```typescript
// Analizar chunks actuales
// - Identificar components nunca cargados
// - Consolidar módulos pequeños
// - Implementar route-level code splitting
```

#### 2️⃣ Change Detection Strategy
```typescript
// En TODOS los components:
@Component({
  selector: 'app-...',
  changeDetection: ChangeDetectionStrategy.OnPush // ← CRÍTICO
})
```

#### 3️⃣ Smart Pagination/Filtering
```typescript
// En BaseService + component:
// - Debounce de búsqueda (300ms)
// - Lazy loading de listas grandes
// - Virtual scrolling para 1000+ items
```

**Herramientas:**
```bash
npm install --save @angular/cdk  # Ya instalado
```

---

### SEMANA 6: Testing Real Data

#### 1️⃣ Completar E2E Tests
```bash
npm install --save-dev cypress
npm install --save-dev @cypress/webpack-dev-server
```

#### 2️⃣ Test Coverage → 70%+
```bash
ng test --code-coverage

# Target:
# - BaseService: 100%
# - Services (CRUD): 95%+
# - Components Smart: 80%+
# - Components Dumb: 50% (OK)
```

#### 3️⃣ Performance Testing
```bash
npm install --save-dev @angular-eslint/builder
# Analizar bundle size
ng build --configuration production --analyze
```

---

### SEMANA 7-8: Deployment & Documentation

#### 1️⃣ Build Optimization
```bash
# Configurar angular.json para producción
# - Budgets: 500KB main, 100KB lazy chunks
# - SourceMaps: disabled en prod
# - Named chunks: enabled para debug
```

#### 2️⃣ Docker & CI/CD
```dockerfile
# Dockerfile
FROM node:22-alpine as build
WORKDIR /app
COPY . .
RUN npm ci --prefer-offline
RUN npm run build -- --configuration production

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
EXPOSE 4200
CMD ["npx", "http-server", "dist/repairhubcoreui/browser"]
```

#### 3️⃣ Documentación Técnica Generada
```bash
npm install --save-dev compodoc
npx compodoc -p tsconfig.json
```

---

## 🛠️ TAREAS INMEDIATAS (HOY - Próximos 3 días)

### DÍA 1: Foundation Setup

**Tarea 1.1:** Crear estructura de estado global
```bash
# Crear archivos:
# src/app/shared/store/
# ├── app-state.interface.ts
# ├── app-state.service.ts
# ├── app-state.service.spec.ts
# ├── cache-manager.service.ts
# ├── cache-manager.service.spec.ts
# └── state-persistence.service.ts
```

**Criterio de Aceptación:**
- ✅ Service inyectable en root
- ✅ Tests unitarios pasando
- ✅ Manejo de sesión usuario
- ✅ Filtros guardados en localStorage

**Tarea 1.2:** Implementar AppStateService
```typescript
// Debe permitir:
// - setState<T>(key: string, value: T)
// - getState<T>(key: string): Observable<T>
// - clearState(key?: string)
// - resetOnLogout()
```

**Tarea 1.3:** Interceptor de HTTP + Error Handling
```bash
# Crear:
# src/app/shared/interceptors/
# ├── jwt.interceptor.ts
# ├── error.interceptor.ts
# ├── logging.interceptor.ts
# └── timeout.interceptor.ts
```

---

### DÍA 2: Integration Points

**Tarea 2.1:** Actualizar environment.ts
```typescript
// Agregar configuración necesaria
// - API URLs
// - Timeouts
// - Feature flags
// - Build info (version, timestamp)
```

**Tarea 2.2:** Refactorizar BaseService
```typescript
// Agregar métodos:
// - cacheGet/cacheSet/cacheClear
// - invalidateCache()
// - withFallback(fallbackData)
// - handleRetry(config)
```

**Tarea 2.3:** Mock API Responses (Mientras API está en desarrollo)
```bash
# Crear:
# src/app/shared/mock-data/
# ├── mock-users.ts
# ├── mock-orders.ts
# ├── mock-employees.ts
# └── mock-api.interceptor.ts
```

---

### DÍA 3: Testing & Validation

**Tarea 3.1:** Actualizar todos los tests de servicios
```typescript
// Agregar casos para:
// - Cache hits/misses
// - Invalidation
// - Retry logic
// - Error handling nuevo
```

**Tarea 3.2:** Validar compilación
```bash
ng build --configuration production
# Debe ejecutarse sin errores
# Bundle size < 500KB main
```

**Tarea 3.3:** Documentar decisiones arquitectónicas
```markdown
# ARCHITECTURE_DECISIONS.md
## ADR-001: State Management Strategy
## ADR-002: Caching Strategy
## ADR-003: Error Handling Convention
```

---

## 📊 MÉTRICAS A ALCANZAR

| Métrica | Actual | Target | Timeline |
|---------|--------|--------|----------|
| Tests | 183 | 250+ | Semana 6 |
| Test Coverage | ~40% | 70% | Semana 6 |
| TypeScript errors | 0 | 0 | Always |
| Bundle size | 8.57MB | <500KB | Semana 5 |
| Lazy chunks | 170 | 50-70 | Semana 5 |
| API integration | 0% | 100% | Semana 4 |
| E2E tests | 0 | 30+ | Semana 6 |
| Documentation | 70% | 95% | Semana 8 |

---

## 🚀 QUICK WINS (Implementar AHORA)

### 1. Change Detection Strategy
```bash
# Buscar y reemplazar en TODOS los components:
# ❌ changeDetection no está especificado
# ✅ changeDetection: ChangeDetectionStrategy.OnPush

# Script para encontrar:
grep -r "@Component" src/app/features --include="*.ts" | grep -v "OnPush"
```

### 2. Memory Leak Prevention
```bash
# Auditar todos OnDestroy
# Asegurar que:
# - takeUntil(destroy$) en TODAS las subscripciones
# - destroy$.next() llamado
# - destroy$.complete() llamado
```

### 3. Loading State Management
```typescript
// Consolidar patrón:
// this.loading$ = this.service.loading$
// NO hacer subscribe en .ts
// USAR en template con | async

// En FormComponent:
// this.isLoading$ = this.service.loading$
// [disabled]="isLoading$ | async"
```

### 4. Form Getter Pattern
```typescript
// Ya implementado bien. Mantener:
get email() { return this.form.get('email'); }
get password() { return this.form.get('password'); }

// En template:
// [ngClass]="{ 'is-invalid': email?.invalid && email?.touched }"
```

---

## 🔍 AUDITORÍA CÓDIGO ACTUAL

### ✅ Bien Hecho

```typescript
// 1. BaseService generic pattern - EXCELENTE
abstract class BaseService<T extends { id: number }> {
  data$: Observable<T[]>
  loading$: Observable<boolean>
  error$: Observable<string | null>
  // Reutilizado en 15 servicios ✓
}

// 2. Smart/Dumb component separation - EXCELENTE
UsersListPageComponent (Smart)
  ├── Inyecta servicio
  ├── Maneja lógica
  └── Pasa datos a dumb component

UsersListComponent (Dumb)
  ├── @Input/@Output
  ├── Sin inyecciones
  └── Presentación pura

// 3. Reactive Forms - BUENO
FormGroup con Validators + CustomValidators
OnChanges para edición mode
FormGetters en template

// 4. RBAC Implementation - EXCELENTE
Guards: authGuard, pinGuard, roleGuard, permissionGuard
Decoradores: @userGuard, @employeeAdminGuard, etc
Routes protegidas correctamente
```

### ⚠️ Áreas de Mejora

```typescript
// 1. FALTA: Typed HTTP client
❌ this.http.get<T[]>(url)
✅ Crear: HttpClientTypedService para type-safety avanzado

// 2. FALTA: Request/Response interceptors
❌ BaseService hace todo
✅ Mover a interceptors globales

// 3. FALTA: Optimistic updates
❌ No hay actualizaciones UI antes de confirmación API
✅ Implementar rollback en caso de error

// 4. FALTA: Offline mode
❌ Si API cae, app no funciona
✅ Service Worker + IndexedDB basic

// 5. FALTA: Componentes sin ChangeDetectionStrategy.OnPush
❌ Algunos components no especifican strategy
✅ Cambiar todos a OnPush para performance

// 6. FALTA: DRY en templates
⚠️ Repetición de patrones de error/loading
✅ Crear shared component wrappers
```

---

## 🎓 PATRÓN RECOMENDADO PARA NUEVOS FEATURES

### Template (Reusable Pattern)

```typescript
// 1. SMART COMPONENT
@Component({
  selector: 'app-feature-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FeatureDumbComponent],
})
export class FeatureListPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  items$ = this.service.data$;
  loading$ = this.service.loading$;
  error$ = this.service.error$;

  constructor(
    private service: FeatureService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.service.getAll();
  }

  onSelect(item: Feature): void {
    this.router.navigate(['/feature', item.id]);
  }

  onDelete(item: Feature): void {
    if (confirm('¿Eliminar?')) {
      this.service.delete(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.service.getAll());
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<!-- 2. DUMB COMPONENT TEMPLATE -->
<div class="container-lg py-4">
  <!-- Loading State -->
  <div *ngIf="loading$ | async" class="text-center p-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>

  <!-- Error State -->
  <div *ngIf="error$ | async as error" class="alert alert-danger">
    {{ error }}
  </div>

  <!-- Content -->
  <div *ngIf="!(loading$ | async)">
    <app-feature-list
      [items]="items$ | async"
      (select)="onSelect($event)"
      (delete)="onDelete($event)">
    </app-feature-list>
  </div>
</div>
```

```typescript
// 3. SERVICE
@Injectable({ providedIn: 'root' })
export class FeatureService extends BaseService<Feature> {
  protected apiUrl = `${environment.apiUrl}/api/feature`;
  
  // Métodos adicionales específicos
  getByStatus(status: string): Observable<Feature[]> {
    return this.http.get<Feature[]>(`${this.apiUrl}?status=${status}`)
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retry({ count: 2, delay: 1000 }),
        tap(data => this.dataSubject.next(data)),
        catchError(err => {
          this.errorSubject.next('Error loading features');
          return throwError(() => err);
        })
      );
  }
}
```

---

## 📦 PACKAGES A AGREGAR (Semana 3+)

```json
{
  "dependencies": {
    "uuid": "^9.0.1",
    "date-fns": "^3.0.0",
    "decimal.js": "^10.4.3"
  },
  "devDependencies": {
    "@angular-eslint/eslint-plugin": "^17.0.0",
    "prettier": "^3.1.0",
    "cypress": "^13.6.0",
    "compodoc": "^1.1.25",
    "ngx-scripts": "^2.0.0"
  }
}
```

---

## ✅ CHECKLIST PARA PRÓXIMA SEMANA

### Antes de iniciar Semana 1:

- [ ] Revisar este documento con equipo
- [ ] Configurar branch `feature/phase-3-integration`
- [ ] Crear issues en GitHub/Jira con tasks específicas
- [ ] Setup lint pre-commit hooks
- [ ] Configurar branch protection rules

### Desarrollo:

- [ ] AppStateService creado y testeado
- [ ] Cache strategy documentada
- [ ] Interceptors implementados
- [ ] Mock API funcionando
- [ ] 200+ tests pasando
- [ ] Build production sin warnings

### Documentación:

- [ ] ADRs escritas
- [ ] Guía de desarrollo actualizada
- [ ] API contracts documentados
- [ ] Deployment guide creado

---

## 🎯 PRÓXIMOS 12 MESES

```
FASE 3 (8 semanas) - Estado + Integración
├── Week 1-2: State Management
├── Week 3-4: API Integration
├── Week 5-6: Performance + Testing
└── Week 7-8: Deployment

FASE 4 (6 semanas) - Features Avanzadas
├── Advanced Reports
├── Analytics Integration
├── Push Notifications
└── Mobile App (React Native)

FASE 5 (4 semanas) - Production Hardening
├── Security Audit
├── Load Testing
├── DR Plan
└── SLA Monitoring
```

---

## 💡 RECOMENDACIONES FINALES

1. **No sobreingenieres** - El patrón BaseService es suficiente
2. **Prioriza tests** - 70% coverage = código confiable
3. **Documenta decisiones** - ADRs son oro puro
4. **Revisa PRs con rigor** - Mantén calidad
5. **Mide performance** - Bundle size matters
6. **Deploy frequently** - Feature flags + canary releases

---

**Próxima revisión:** Semana 2 de Fase 3

**Preguntas?** Crear issue con tag `architecture-decision`
