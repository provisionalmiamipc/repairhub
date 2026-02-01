# 🚀 DÍA 1: Setup Servicios HTTP Base

## Objetivos del DÍA 1

```
✅ Crear api.service.ts base con HttpClient
✅ Crear 5+ servicios por entidad (User, Order, Customer, etc)
✅ Implementar interceptor JWT
✅ Configurar manejo de errores global
✅ Resolver de datos para rutas
✅ Verificar que compilación es sin errores
```

---

## PARTE A: Configuración Base (2 horas)

### 1. Actualizar environment.ts

**Archivo:** `src/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // Agregar esta línea
};
```

**Archivo:** `src/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // Usar ruta relativa en producción
};
```

---

### 2. Crear Base API Service

**Archivo:** `src/app/shared/services/api.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(catchError(this.handleError));
  }

  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(catchError(this.handleError));
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error ${error.status}: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
```

---

### 3. Crear HTTP Interceptor para JWT

**Archivo:** `src/app/shared/interceptors/auth.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token del localStorage
    const token = localStorage.getItem('jwt_token');
    
    // Si existe token, agregarlo al header
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(req);
  }
}
```

---

### 4. Crear Error Interceptor

**Archivo:** `src/app/shared/interceptors/error.interceptor.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Si error 401 (sin autorización) → redirigir a login
        if (error.status === 401) {
          localStorage.removeItem('jwt_token');
          this.router.navigate(['/login']);
        }
        
        // Si error 403 (forbidden) → acceso denegado
        if (error.status === 403) {
          console.error('Acceso denegado');
        }
        
        // Si error 404 → recurso no encontrado
        if (error.status === 404) {
          console.error('Recurso no encontrado');
        }
        
        // Propagar error
        return throwError(() => error);
      })
    );
  }
}
```

---

### 5. Registrar Interceptors en app.config.ts

**Archivo:** `src/app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { ErrorInterceptor } from './shared/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
};
```

---

## PARTE B: Servicios por Entidad (3 horas)

### 6. User Service

**Archivo:** `src/app/shared/services/user.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(page = 0, size = 10): Observable<User[]> {
    this.loadingSubject.next(true);
    return this.api.get<User[]>('/users', {
      params: { page, size }
    }).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getById(id: number): Observable<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    this.loadingSubject.next(true);
    return this.api.post<User>('/users', user).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  update(id: number, user: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);
    return this.api.put<User>(`/users/${id}`, user).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }

  search(query: string): Observable<User[]> {
    return this.api.get<User[]>('/users/search', {
      params: { q: query }
    });
  }
}
```

---

### 7. Order Service (PATRÓN SIMILAR)

**Archivo:** `src/app/shared/services/order.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Order {
  id: number;
  number: string;
  customerId: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(page = 0, size = 10): Observable<Order[]> {
    this.loadingSubject.next(true);
    return this.api.get<Order[]>('/orders', {
      params: { page, size }
    }).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getById(id: number): Observable<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Observable<Order> {
    this.loadingSubject.next(true);
    return this.api.post<Order>('/orders', order).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  update(id: number, order: Partial<Order>): Observable<Order> {
    this.loadingSubject.next(true);
    return this.api.put<Order>(`/orders/${id}`, order).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/orders/${id}`);
  }

  getByStatus(status: Order['status']): Observable<Order[]> {
    return this.api.get<Order[]>('/orders/status/' + status);
  }
}
```

---

### 8. Customer Service (PATRÓN SIMILAR)

**Archivo:** `src/app/shared/services/customer.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(page = 0, size = 10): Observable<Customer[]> {
    this.loadingSubject.next(true);
    return this.api.get<Customer[]>('/customers', {
      params: { page, size }
    }).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getById(id: number): Observable<Customer> {
    return this.api.get<Customer>(`/customers/${id}`);
  }

  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Observable<Customer> {
    this.loadingSubject.next(true);
    return this.api.post<Customer>('/customers', customer).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  update(id: number, customer: Partial<Customer>): Observable<Customer> {
    this.loadingSubject.next(true);
    return this.api.put<Customer>(`/customers/${id}`, customer).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/customers/${id}`);
  }

  search(query: string): Observable<Customer[]> {
    return this.api.get<Customer[]>('/customers/search', {
      params: { q: query }
    });
  }
}
```

---

### 9. Employee Service (PATRÓN SIMILAR)

**Archivo:** `src/app/shared/services/employee.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  salary?: number;
  active: boolean;
  hireDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor(private api: ApiService) {}

  getAll(page = 0, size = 10): Observable<Employee[]> {
    this.loadingSubject.next(true);
    return this.api.get<Employee[]>('/employees', {
      params: { page, size }
    }).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  getById(id: number): Observable<Employee> {
    return this.api.get<Employee>(`/employees/${id}`);
  }

  create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Observable<Employee> {
    this.loadingSubject.next(true);
    return this.api.post<Employee>('/employees', employee).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  update(id: number, employee: Partial<Employee>): Observable<Employee> {
    this.loadingSubject.next(true);
    return this.api.put<Employee>(`/employees/${id}`, employee).pipe(
      tap(() => this.loadingSubject.next(false))
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/employees/${id}`);
  }

  getByDepartment(department: string): Observable<Employee[]> {
    return this.api.get<Employee[]>('/employees/department/' + department);
  }
}
```

---

## PARTE C: Testing y Validación (2-3 horas)

### 10. Crear Archivo de Test para Service

**Archivo:** `src/app/shared/services/user.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all users', () => {
    const mockUsers = [
      { id: 1, name: 'Juan', email: 'juan@example.com', role: 'admin', active: true },
      { id: 2, name: 'María', email: 'maria@example.com', role: 'user', active: true }
    ];

    service.getAll().subscribe(users => {
      expect(users.length).toBe(2);
      expect(users[0].name).toBe('Juan');
    });

    const req = httpMock.expectOne(req => req.url.includes('/users'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should create a new user', () => {
    const newUser = { name: 'Pedro', email: 'pedro@example.com', phone: '123456789', role: 'user', active: true };
    const mockResponse = { id: 3, ...newUser, createdAt: new Date() };

    service.create(newUser).subscribe(user => {
      expect(user.id).toBe(3);
      expect(user.name).toBe('Pedro');
    });

    const req = httpMock.expectOne(req => req.url.includes('/users'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should delete a user', () => {
    service.delete(1).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(req => req.url.includes('/users/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
```

---

### 11. Verificación de Compilación

```bash
# En terminal
cd /home/alfego/Documentos/repairhubcoreui

# Instalar dependencias (si es necesario)
npm install

# Verificar compilación
npm run build

# Si todo está bien, deberías ver:
# ✔ Browser bundle generated successfully

# Si hay errores, el build mostrará qué corregir
```

---

### 12. Iniciar servidor de desarrollo

```bash
# En terminal
npm start

# Deberías ver:
# → Local: http://localhost:4200
# → Application bundle generated successfully

# En otro terminal, verifica que API está corriendo:
npm start:dev  # En /home/alfego/Documentos/repairhub-api
```

---

## Checklist DÍA 1 - Final

- [ ] `api.service.ts` creado y funcionando
- [ ] `auth.interceptor.ts` implementado
- [ ] `error.interceptor.ts` implementado
- [ ] `user.service.ts` completo
- [ ] `order.service.ts` completo
- [ ] `customer.service.ts` completo
- [ ] `employee.service.ts` completo
- [ ] Interceptors registrados en `app.config.ts`
- [ ] `npm run build` sin errores
- [ ] `npm start` sin errores
- [ ] API en `http://localhost:3000/docs` funcional
- [ ] JWT token puede obtenerse de login

---

## Archivos Creados DÍA 1

```
src/app/shared/
├── services/
│   ├── api.service.ts ............... Base HTTP service
│   ├── user.service.ts .............. CRUD usuarios
│   ├── order.service.ts ............. CRUD órdenes
│   ├── customer.service.ts .......... CRUD clientes
│   ├── employee.service.ts .......... CRUD empleados
│   └── user.service.spec.ts ......... Tests
└── interceptors/
    ├── auth.interceptor.ts .......... JWT token
    └── error.interceptor.ts ......... Global errors
```

---

## Si hay Errores

### Error: "Cannot find module '@angular/common/http'"
```bash
npm install @angular/common@latest
```

### Error: "HTTP_INTERCEPTORS is not exported from..."
```bash
# Asegurar que app.config.ts tiene las importaciones correctas
import { HTTP_INTERCEPTORS } from '@angular/common/http';
```

### Error: "Cannot resolve '@app/...' alias"
```bash
# Verificar tsconfig.json tenga paths configurado:
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/app/*"],
      "@shared/*": ["src/app/shared/*"]
    }
  }
}
```

---

## Notas Importantes

✅ Los servicios están listos para ser inyectados en componentes
✅ Los interceptors se aplican automáticamente a todos los requests HTTP
✅ El error handling es global pero puedes hacer override en componentes
✅ Los BehaviorSubjects permiten que componentes observen loading/error state

---

**¡Fin DÍA 1! 🚀**

Mañana continuamos con PARTE D: Conectar componentes con estos servicios en DÍA 2.
