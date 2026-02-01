# 🔧 RECOMENDACIONES TÉCNICAS DETALLADAS - RepairHub

**Especialista:** Arquitecto Full-Stack (Angular + NestJS)  
**Fecha:** 29 de Enero 2026  
**Propósito:** Guía técnica específica para implementación  

---

## 📋 TABLA DE CONTENIDOS

1. [Frontend: Angular 20](#frontend-angular-20)
2. [Backend: NestJS](#backend-nestjs)
3. [Database & ORM](#database--orm)
4. [DevOps & Deployment](#devops--deployment)
5. [Testing Strategy](#testing-strategy)
6. [Performance & Optimization](#performance--optimization)
7. [Security Hardening](#security-hardening)

---

## 🎨 Frontend: Angular 20

### 1.1 Actualizar a Signals API Completamente

**Estado:** Ya hay signals, pero mixtos con Observables  
**Recomendación:** Unificar a Signals en componentes nuevos

```typescript
// ✅ NUEVO PATRÓN (usar en nuevos componentes)
import { signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-users-list',
  standalone: true,
  template: `
    <div>
      <input [(ngModel)]="searchTerm()" placeholder="Search...">
      <div *ngFor="let user of filteredUsers()">
        {{ user.name }}
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit {
  // Signals reactivas
  users = signal<User[]>([]);
  searchTerm = signal('');
  loading = signal(false);
  error = signal<string | null>(null);

  // Computed properties (reemplaza .pipe(map(...)))
  filteredUsers = computed(() =>
    this.users().filter(u =>
      u.name.toLowerCase().includes(this.searchTerm().toLowerCase())
    )
  );

  totalUsers = computed(() => this.users().length);

  constructor(private usersService: UsersService) {
    // Effect reemplaza ngOnInit (observable-like)
    effect(() => {
      if (this.searchTerm()) {
        this.loading.set(true);
        this.usersService.search(this.searchTerm()).subscribe({
          next: (users) => {
            this.users.set(users);
            this.loading.set(false);
          },
          error: (err) => {
            this.error.set(err.message);
            this.loading.set(false);
          }
        });
      }
    });
  }
}
```

**Beneficios:**
- 40% menos líneas de código
- Mejor performance (no crea observables innecesarios)
- Más legible que RxJS

---

### 1.2 Implementar Standalone Components Completamente

**Estado:** Parcialmente implementado  
**Recomendación:** 100% standalone en nuevos componentes

```typescript
// ✅ CORRECTO: Standalone
@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CdkModule],
  template: `...`,
  styleUrls: ['./order-card.component.scss']
})
export class OrderCardComponent {
  order = input.required<Order>();
  onDelete = output<void>();
}

// ❌ EVITAR: Módulos
@NgModule({
  declarations: [OrderCardComponent],
  imports: [CommonModule]
})
export class OrdersModule { }
```

**Ventajas:**
- Lazy loading automático
- Tree-shaking mejor
- Reducción ~15% bundle size

---

### 1.3 Optimización de Change Detection

**Estado:** OnPush no está implementado  
**Recomendación:** Agregar OnPush en componentes dumb

```typescript
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush, // ← AGREGAR
  standalone: true,
  template: `
    <div class="card">
      <h5>{{ user.name }}</h5>
      <p>{{ user.email }}</p>
      <button (click)="onEdit.emit()">Edit</button>
    </div>
  `
})
export class UserCardComponent {
  @Input() user!: User;
  @Output() onEdit = new EventEmitter<void>();
}
```

**Impacto:** +25% performance en listas grandes

---

### 1.4 Refactor CommonModule a Imports

**Estado:** Algunos componentes aún importan CommonModule  
**Recomendación:** Reemplazar con imports específicos

```typescript
// ❌ ANTIGUO
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})

// ✅ NUEVO
@Component({
  standalone: true,
  imports: [
    CommonModule,           // Sí usar cuando necesitas *ngIf, *ngFor
    ReactiveFormsModule,
    NgFor, NgIf,            // O importar directives específicas
    NgSwitch, NgSwitchDefault, NgSwitchCase
  ]
})
```

---

## 🌐 Backend: NestJS

### 2.1 Implementar DTO Strictly Typed

**Estado:** DTOs básicos, sin validation decorators completos  
**Recomendación:** Max validation coverage

```typescript
// 📁 src/orders/dto/create-order.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  centerId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsEnum(OrderStatus)
  status: OrderStatus = OrderStatus.PENDING;

  @IsOptional()
  notes?: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

// Controller
@Controller('orders')
export class OrdersController {
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
```

**Beneficios:**
- Validación automática
- Documentación API mejorada
- Menos bugs

---

### 2.2 Implementar Custom Decorators

**Estado:** No hay decorators custom  
**Recomendación:** Crear decorators para validaciones complejas

```typescript
// 📁 src/common/decorators/is-valid-center-store.decorator.ts
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
  ValidationArguments
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidCenterStore', async: true })
export class IsValidCenterStoreConstraint implements ValidatorConstraintInterface {
  constructor(private centersService: CentersService) {}

  async validate(value: any, args: ValidationArguments) {
    const [centerId, storeId] = [
      value.centerId,
      value.storeId
    ];

    const center = await this.centersService.findOne(centerId);
    if (!center) return false;

    const store = center.stores?.find(s => s.id === storeId);
    return !!store;
  }

  defaultMessage(args: ValidationArguments) {
    return `Store must belong to the specified Center`;
  }
}

export function IsValidCenterStore(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCenterStoreConstraint
    });
  };
}

// Uso en DTO
export class CreateOrderDto {
  @IsNotEmpty()
  @IsValidCenterStore()
  centerStore: { centerId: number; storeId: number };
}
```

---

### 2.3 Implementar Query Optimization Automática

**Estado:** No hay select ni relations optimizadas  
**Recomendación:** Helper para queries eficientes

```typescript
// 📁 src/common/utils/query.builder.ts
import { SelectQueryBuilder } from 'typeorm';

export class QueryBuilder {
  static selectFields<T>(
    qb: SelectQueryBuilder<T>,
    entity: string,
    fields: string[]
  ) {
    return qb.select(fields.map(f => `${entity}.${f}`));
  }

  static withRelations<T>(
    qb: SelectQueryBuilder<T>,
    relations: string[]
  ) {
    relations.forEach(rel => {
      qb.leftJoinAndSelect(`${qb.alias}.${rel}`, rel);
    });
    return qb;
  }

  static withPagination<T>(
    qb: SelectQueryBuilder<T>,
    page: number,
    pageSize: number
  ) {
    const skip = (page - 1) * pageSize;
    return qb.skip(skip).take(pageSize);
  }
}

// Uso en service
@Injectable()
export class OrdersService {
  async findAll(page = 1, pageSize = 20) {
    const qb = this.ordersRepository.createQueryBuilder('order');

    QueryBuilder.withRelations(qb, ['customer', 'employee', 'center', 'store', 'items']);
    QueryBuilder.selectFields(qb, 'order', [
      'id',
      'totalPrice',
      'status',
      'createdAt'
    ]);
    QueryBuilder.withPagination(qb, page, pageSize);

    return qb.getManyAndCount();
  }
}
```

---

### 2.4 Implementar Service Caching Layer

**Estado:** Sin cache en backend  
**Recomendación:** Redis cache decorator

```typescript
// 📁 src/common/decorators/cacheable.decorator.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

export function Cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = this.cacheManager as Cache;
      const cacheKey = `${target.name}:${propertyKey}:${JSON.stringify(args)}`;

      try {
        const cached = await cache.get(cacheKey);
        if (cached) return cached;
      } catch (e) {
        console.error('Cache get error:', e);
      }

      const result = await originalMethod.apply(this, args);

      try {
        await cache.set(cacheKey, result, ttl * 1000);
      } catch (e) {
        console.error('Cache set error:', e);
      }

      return result;
    };

    return descriptor;
  };
}

// Uso
@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  @Cacheable(300) // 5 minutos
  async findAll() {
    return this.usersRepository.find();
  }
}
```

**Instalación:**
```bash
npm install @nestjs/cache-manager cache-manager
npm install -D @types/cache-manager
```

---

## 💾 Database & ORM

### 3.1 Optimizar Índices PostgreSQL

**Estado:** Índices básicos  
**Recomendación:** Índices estratégicos

```sql
-- 📌 Índices de búsqueda frecuente
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 📌 Índices compuestos (queries multi-field)
CREATE INDEX idx_orders_customer_center ON orders(customer_id, center_id);
CREATE INDEX idx_inventory_center_store ON inventory_items(center_id, store_id);

-- 📌 Índices para LIKE queries
CREATE INDEX idx_users_name ON users USING gin(name gin_trgm_ops);

-- Verificar índices existentes
\d+ orders
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 1;
```

---

### 3.2 Implementar Migrations Robustas

**Estado:** Migraciones existen  
**Recomendación:** Hacer robustas con rollback

```typescript
// 📁 src/migrations/1706500000000-AddOrderIndexes.ts
import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddOrderIndexes1706500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        columnNames: ['customer_id'],
        name: 'idx_orders_customer_id'
      })
    );

    await queryRunner.createIndex(
      'orders',
      new TableIndex({
        columnNames: ['created_at'],
        name: 'idx_orders_created_at',
        isUnique: false
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('orders', 'idx_orders_customer_id');
    await queryRunner.dropIndex('orders', 'idx_orders_created_at');
  }
}
```

---

## 🚀 DevOps & Deployment

### 4.1 Setup CI/CD con GitHub Actions

**Estado:** No hay CI/CD  
**Recomendación:** Pipeline automático

```yaml
# 📁 .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install
        working-directory: ./repairhub-api

      - name: Lint
        run: npm run lint
        working-directory: ./repairhub-api

      - name: Build
        run: npm run build
        working-directory: ./repairhub-api

      - name: Unit Tests
        run: npm test
        working-directory: ./repairhub-api

      - name: E2E Tests
        run: npm run test:e2e
        working-directory: ./repairhub-api
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/repairhub_test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install
        working-directory: ./repairhubcoreui

      - name: Lint
        run: npm run lint
        working-directory: ./repairhubcoreui

      - name: Build
        run: npm run build
        working-directory: ./repairhubcoreui

      - name: Tests
        run: npm test -- --watch=false
        working-directory: ./repairhubcoreui

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./repairhubcoreui/coverage/lcov.info
```

---

### 4.2 Docker Optimization

**Estado:** Dockerfile básico  
**Recomendación:** Multi-stage build

```dockerfile
# 📁 Dockerfile (NestJS Backend)
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init

# Copiar solo dist y node_modules desde builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

**Build optimizado:**
```bash
docker build -t repairhub-api:latest \
  --build-arg NODE_ENV=production \
  -f Dockerfile .

# Tamaño resultante: ~150MB (vs 500MB+ sin optimizar)
```

---

## 🧪 Testing Strategy

### 5.1 Frontend: Unit Tests Coverage

**Estructura recomendada:**

```typescript
// 📁 src/app/features/orders/orders.service.spec.ts
describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrdersService]
    });

    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should fetch all orders', (done) => {
      const mockOrders: Order[] = [
        { id: 1, totalPrice: 1000, status: 'pending' }
      ];

      service.getAll().subscribe(orders => {
        expect(orders.length).toBe(1);
        expect(orders[0].id).toBe(1);
        done();
      });

      const req = httpMock.expectOne('/api/orders');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrders);
    });

    it('should handle errors', (done) => {
      service.getAll().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(404);
          done();
        }
      );

      const req = httpMock.expectOne('/api/orders');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create', () => {
    it('should create an order', (done) => {
      const newOrder: Order = { totalPrice: 500, status: 'pending' };

      service.create(newOrder).subscribe(created => {
        expect(created.id).toBe(1);
        done();
      });

      const req = httpMock.expectOne('/api/orders');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newOrder);
      req.flush({ ...newOrder, id: 1 });
    });
  });
});
```

**Target:** 80%+ coverage en cada módulo

---

### 5.2 E2E Tests con Cypress

**Setup:**
```bash
npm install --save-dev cypress
npx cypress open
```

```typescript
// 📁 cypress/e2e/orders.cy.ts
describe('Orders Module E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200');
    cy.login('admin@example.com', 'password123');
  });

  it('should display orders list', () => {
    cy.visit('/orders');
    cy.get('app-orders-list').should('be.visible');
    cy.contains('Orders').should('be.visible');
  });

  it('should create new order', () => {
    cy.visit('/orders');
    cy.get('[data-testid="btn-new-order"]').click();
    
    // Step 1: Select customer
    cy.get('[data-testid="customer-select"]').click();
    cy.contains('John Doe').click();
    cy.get('[data-testid="btn-next"]').click();

    // Step 2: Select items
    cy.get('[data-testid="item-select"]').click();
    cy.contains('Laptop').click();
    cy.get('[data-testid="quantity"]').type('2');
    cy.get('[data-testid="btn-submit"]').click();

    cy.contains('Order created successfully').should('be.visible');
  });

  it('should edit order', () => {
    cy.visit('/orders');
    cy.get('[data-testid="edit-order-1"]').click();
    cy.get('[data-testid="status-select"]').select('processing');
    cy.get('[data-testid="btn-save"]').click();
    
    cy.contains('Order updated').should('be.visible');
  });

  it('should delete order', () => {
    cy.visit('/orders');
    cy.get('[data-testid="delete-order-1"]').click();
    cy.contains('Are you sure?').parent().contains('Delete').click();
    
    cy.contains('Order deleted').should('be.visible');
  });
});
```

---

## 🎯 Performance & Optimization

### 6.1 Frontend Performance Checklist

```
✅ Lazy Loading de rutas
✅ Signals en lugar de Observables simples
✅ OnPush change detection
✅ Unsubscribe en OnDestroy
✅ Image compression

🔄 PENDIENTE:
[ ] Minification + Uglification
[ ] Code splitting por módulo
[ ] Compression (gzip)
[ ] CDN para assets
[ ] Service Worker (PWA)
[ ] Tree-shaking optimization
[ ] Bundle analyzer

RECOMENDACIONES:
npm install --save-dev webpack-bundle-analyzer
ng build --stats-json
webpack-bundle-analyzer dist/repairhubcoreui/stats.json
```

---

### 6.2 Backend Performance Checklist

```
✅ Lazy module loading
✅ DTOs validation

🔄 PENDIENTE:
[ ] Connection pooling
[ ] Query result pagination
[ ] Caching layer (Redis)
[ ] Compression middleware
[ ] Rate limiting
[ ] Request logging
[ ] Database indexes optimization

IMPLEMENTAR:
npm install @nestjs/throttler
npm install redis
npm install class-validator
```

---

## 🔐 Security Hardening

### 7.1 OWASP Top 10 Checklist

```typescript
// 1️⃣ Injection Prevention
✅ DTOs + class-validator (SQL injection)
✅ Parameterized queries (TypeORM)
❌ GraphQL ready? (considera para futuro)

// 2️⃣ Authentication
✅ JWT con refresh tokens
✅ Password hashing con bcrypt
❌ 2FA? (considera implementar)
❌ Social login? (considera)

// 3️⃣ Sensitive Data Exposure
❌ HTTPS enforcement (Nginx)
❌ TLS 1.3 minimal
[ ] Encrypt sensitive fields en DB

// 4️⃣ XML External Entities (XXE)
✅ No usando XML, JSON solo

// 5️⃣ Broken Access Control
✅ RBAC implementado
✅ Guards en rutas
❌ Audit logging? (considera)

// 6️⃣ Security Misconfiguration
✅ Environment variables configuradas
❌ Helmet.js (CORS, CSP headers)

// 7️⃣ Cross-Site Scripting (XSS)
✅ Angular auto-escapes by default
❌ CSP headers? (falta)

// 8️⃣ Insecure Deserialization
✅ Validación DTOs previene

// 9️⃣ Using Components with Known Vulnerabilities
✅ Packages actualizadas
[ ] npm audit regularmente

// 🔟 Insufficient Logging & Monitoring
❌ Structured logging (Winston)
❌ Error tracking (Sentry)
```

---

## 📝 CONCLUSIÓN TÉCNICA

**Implementar en orden de prioridad:**

1. **ESTA SEMANA (Crítico):**
   - [ ] Deshabilitar MockApi en prod
   - [ ] AppStateService + persistencia
   - [ ] CacheManager en BaseService

2. **PRÓXIMA SEMANA (Alto):**
   - [ ] Unit tests Backend (50%)
   - [ ] E2E tests básicos
   - [ ] Query optimization

3. **MES 2 (Medio):**
   - [ ] Redis caching layer
   - [ ] CI/CD pipeline
   - [ ] Security hardening

4. **MES 3+ (Bajo):**
   - [ ] PWA features
   - [ ] Advanced monitoring
   - [ ] Performance tuning fino

---

**Keep building! 🚀**
