# 🔌 API Integration Guide

**Documento:** Guía paso a paso para integración con Backend  
**Estado:** Pre-implementación  
**Versión:** 1.0  

---

## 📋 Pre-requisitos

### Configuración Backend (NestJS)

Tu API en `/home/alfego/Documentos/repairhub-api` debe tener:

✅ **CORS habilitado:**
```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
});
```

✅ **JWT Middleware:**
```typescript
// auth.middleware.ts
// Debe retornar: { accessToken, refreshToken, user: {...} }
```

✅ **Error Format Estándar:**
```typescript
// Formato esperado:
{
  statusCode: number;
  message: string;
  errors?: { [field: string]: string[] };
  timestamp: string;
  path: string;
}
```

---

## 🔧 PASO 1: Configurar Environment

### Archivo: `src/environment.ts`

```typescript
export const environment = {
  production: false,
  
  // API Configuration
  apiUrl: 'http://localhost:3000',
  apiVersion: 'v1',
  
  // HTTP Timeouts
  httpTimeout: 30000, // 30 segundos
  
  // Retry Strategy
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
  retryBackoff: true, // Exponential backoff
  
  // Cache TTLs
  cacheTtl: {
    users: 5 * 60 * 1000,      // 5 min
    orders: 10 * 60 * 1000,    // 10 min
    default: 3 * 60 * 1000,    // 3 min
  },
  
  // Feature Flags
  features: {
    offlineMode: true,
    caching: true,
    optimisticUpdates: false, // Implementar después
    analytics: false,
  },
  
  // Build Info
  version: '2.1.0',
  buildTime: new Date().toISOString(),
};

export const environment.prod = {
  production: true,
  apiUrl: 'https://api.repairhub.com',
  httpTimeout: 60000,
  retryAttempts: 5,
  // ... etc
};
```

---

## 🚀 PASO 2: Crear Interceptors

### A. JWT Interceptor

**Archivo:** `src/app/shared/interceptors/jwt.interceptor.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AppStateService } from '../store/app-state.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private appState = inject(AppStateService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.appState.snapshot.user?.token; // Obtener token del estado

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }
}
```

### B. Error Interceptor

**Archivo:** `src/app/shared/interceptors/error.interceptor.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ApiErrorResponse } from '../models/api-error.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expirado - intentar refresh
          return this.authService.refreshToken().pipe(
            switchMap(() => next.handle(req)), // Reintentar request original
            catchError(() => {
              // Refresh falló - logout
              this.authService.logout();
              return throwError(() => error);
            })
          );
        }

        if (error.status === 403) {
          this.toastService.error('No tienes permisos para esta acción');
        }

        if (error.status >= 500) {
          this.toastService.error('Error en servidor. Intenta más tarde');
        }

        return throwError(() => error);
      })
    );
  }
}
```

### C. Register Interceptors

**En:** `src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './shared/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './shared/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
  ],
};
```

---

## 📡 PASO 3: Actualizar BaseService

**Archivo:** `src/app/shared/services/base.service.ts`

```typescript
export abstract class BaseService<T extends { id: number }> {
  protected abstract apiUrl: string;

  constructor(
    protected http: HttpClient,
    protected cache: CacheManagerService,
    protected appState: AppStateService
  ) {}

  /**
   * Obtener todos los registros con caché
   */
  getAll(useCache: boolean = true): Observable<T[]> {
    const cacheKey = `${this.apiUrl}:all`;

    if (useCache) {
      return this.cache.get(cacheKey, () => this.fetchAll(), 5 * 60 * 1000);
    }

    return this.fetchAll();
  }

  private fetchAll(): Observable<T[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<T[]>(this.apiUrl).pipe(
      timeout(30000),
      retry({ count: 3, delay: 1000 }),
      tap((data) => {
        this.dataSubject.next(data);
      }),
      catchError((err) => this.handleError(err)),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  /**
   * Obtener por ID con caché
   */
  getById(id: number, useCache: boolean = true): Observable<T> {
    const cacheKey = `${this.apiUrl}:${id}`;
    const url = `${this.apiUrl}/${id}`;

    if (useCache) {
      return this.cache.get(cacheKey, () => this.http.get<T>(url), 10 * 60 * 1000);
    }

    return this.http.get<T>(url);
  }

  /**
   * Crear con invalidación de caché
   */
  create(data: Partial<T>): Observable<T> {
    return this.http.post<T>(this.apiUrl, data).pipe(
      tap((created) => {
        // Invalidar lista
        this.cache.invalidate(`${this.apiUrl}:*`);
        // Actualizar state local
        const current = this.dataSubject.value;
        this.dataSubject.next([...current, created]);
      }),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * Actualizar con invalidación de caché
   */
  update(id: number, data: Partial<T>): Observable<T> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.patch<T>(url, data).pipe(
      tap((updated) => {
        // Invalidar caché específico e lista
        this.cache.invalidate(`${this.apiUrl}:${id}`);
        this.cache.invalidate(`${this.apiUrl}:*`);
        // Actualizar state local
        const current = this.dataSubject.value.map((item) =>
          item.id === id ? updated : item
        );
        this.dataSubject.next(current);
      }),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * Eliminar con invalidación de caché
   */
  delete(id: number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(
      tap(() => {
        // Invalidar caché
        this.cache.invalidate(`${this.apiUrl}:${id}`);
        this.cache.invalidate(`${this.apiUrl}:*`);
        // Actualizar state local
        const current = this.dataSubject.value.filter((item) => item.id !== id);
        this.dataSubject.next(current);
      }),
      catchError((err) => this.handleError(err))
    );
  }

  /**
   * Manejo de errores estandarizado
   */
  protected handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      message = error.error.message;
    } else {
      // Error del servidor
      const apiError = error.error as ApiErrorResponse;
      message = apiError?.message || error.statusText;
    }

    this.errorSubject.next(message);
    console.error('[API Error]', error);

    return throwError(() => new Error(message));
  }
}
```

---

## 🧪 PASO 4: Test con API Real

### Mock API Interceptor (mientras desarrollas backend)

**Archivo:** `src/app/shared/interceptors/mock-api.interceptor.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  private mockData = {
    '/api/users': [
      { id: 1, email: 'admin@example.com', firstName: 'Admin', lastName: 'User' },
      { id: 2, email: 'user@example.com', firstName: 'John', lastName: 'Doe' },
    ],
    '/api/orders': [
      { id: 1, totalPrice: 100, totalCost: 80 },
      { id: 2, totalPrice: 200, totalCost: 150 },
    ],
  };

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Solo usar mock para endpoints específicos
    if (req.url.includes('/api/') && this.mockData[req.url as keyof typeof this.mockData]) {
      const mockData = this.mockData[req.url as keyof typeof this.mockData];
      return of(new HttpResponse({ status: 200, body: mockData })).pipe(delay(500));
    }

    return next.handle(req);
  }
}
```

---

## 📝 PASO 5: Actualizar AuthService

**Archivo:** `src/app/shared/services/auth.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { AppStateService } from '../store/app-state.service';
import { environment } from '../../../environment';
import { UserSession } from '../store/app-state.interface';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSession;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private appState = inject(AppStateService);
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor() {
    this.restoreSession();
  }

  /**
   * Login
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.storeSession(response);
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.storeSession(response);
        }),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Refresh failed'));
        })
      );
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.appState.clearUserSession();
  }

  /**
   * ==================== PRIVATE ====================
   */

  private storeSession(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    this.appState.set('user', response.user);
  }

  private restoreSession(): void {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      // Validar si aún es válido
      // Si no, intentar refresh
    }
  }
}
```

---

## ✅ Checklist de Integración

- [ ] Environment configurado
- [ ] JWT Interceptor implementado
- [ ] Error Interceptor implementado
- [ ] BaseService actualizado con caché
- [ ] AuthService implementado
- [ ] Tests de servicios actualizados
- [ ] Mock API funcionando
- [ ] Backend CORS habilitado
- [ ] API real testeable con Postman
- [ ] Documentación actualizada

---

## 🧪 Testing Integration

```bash
# 1. Iniciar backend en puerto 3000
cd /home/alfego/Documentos/repairhub-api
npm run start

# 2. Iniciar frontend en puerto 4200
cd /home/alfego/Documentos/repairhubcoreui
npm start

# 3. Testear con Postman
# Importar colección: scripts/postman_collection.json

# 4. Verificar en DevTools
# F12 > Network > Observar requests
```

---

## 🚨 Troubleshooting

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución:** Asegurar que backend tiene CORS configurado correctamente

### 401 Unauthorized
```
Token expirado o inválido
```
**Solución:** Implementar refresh token automático en ErrorInterceptor

### Caché outdated
```
Ver datos viejos aunque backend cambió
```
**Solución:** Llamar `this.cache.invalidate()` al actualizar

---

**Próximo paso:** Implementar PASO 2 de Semana 1
