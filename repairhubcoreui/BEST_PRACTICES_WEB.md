# 🎯 Buenas Prácticas Web para RepairHub Angular

## 1. DISEÑO RESPONSIVO (Responsive Web Design)

### ✅ Lo que ya tienes
- Bootstrap 5 (framework responsivo)
- Grid system automático
- Breakpoints configurados
- Mobile-first approach

### ✨ Mejoras a Implementar

#### 1.1 Tablas Responsivas
```html
<!-- ❌ Evitar: Tablas que no caben en mobile -->
<table class="table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Nombre</th>
      <th>Email</th>
      <th>Teléfono</th>
      <th>Dirección</th>
      <th>Acciones</th>
    </tr>
  </thead>
</table>

<!-- ✅ Mejor: Tabla responsiva con cards en mobile -->
<div class="d-none d-lg-block">
  <!-- Tabla para desktop (lg y up) -->
  <table class="table">
    <!-- ... -->
  </table>
</div>

<div class="d-lg-none">
  <!-- Cards para mobile -->
  <div class="card" *ngFor="let user of users">
    <div class="card-body">
      <h6>{{ user.name }}</h6>
      <p>{{ user.email }}</p>
      <!-- ... -->
    </div>
  </div>
</div>
```

#### 1.2 Layouts Adaptables
```html
<!-- ✅ Grid responsivo -->
<div class="row">
  <!-- 1 columna en mobile, 2 en tablet, 3 en desktop -->
  <div class="col-12 col-md-6 col-lg-4">
    <app-card></app-card>
  </div>
</div>

<!-- ✅ Navegación responsive -->
<nav class="navbar navbar-expand-lg">
  <button class="navbar-toggler" (click)="toggleMenu()">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div [ngClass]="{'show': menuOpen}" class="collapse navbar-collapse">
    <!-- Items de menú -->
  </div>
</nav>
```

#### 1.3 Images Responsivas
```html
<!-- ✅ Imágenes responsivas con srcset -->
<img 
  src="assets/logo.png"
  srcset="assets/logo.png 1x, assets/logo@2x.png 2x"
  alt="RepairHub Logo"
  class="img-fluid"
  loading="lazy"
/>

<!-- ✅ Picture para diferentes formatos -->
<picture>
  <source media="(min-width: 1200px)" srcset="assets/large.jpg">
  <source media="(min-width: 768px)" srcset="assets/medium.jpg">
  <img src="assets/small.jpg" alt="Descripción" class="img-fluid">
</picture>
```

---

## 2. ACCESIBILIDAD (WCAG 2.1 AA)

### ✅ Implementar

#### 2.1 Semántica HTML
```html
<!-- ❌ Malo -->
<div class="button" (click)="submit()">Guardar</div>

<!-- ✅ Bueno -->
<button type="submit" aria-label="Guardar datos del usuario">
  Guardar
</button>

<!-- ✅ Excelente con ícono -->
<button type="submit" aria-label="Guardar datos del usuario">
  <i class="bi bi-check-lg"></i>
  <span class="ms-2">Guardar</span>
</button>
```

#### 2.2 Labels y Formularios
```html
<!-- ❌ Malo -->
<input type="email" placeholder="Email">

<!-- ✅ Bueno -->
<label for="email">Correo Electrónico</label>
<input 
  id="email" 
  type="email" 
  placeholder="ejemplo@gmail.com"
  aria-required="true"
  aria-describedby="email-error"
/>
<small id="email-error" class="text-danger" *ngIf="emailError">
  {{ emailError }}
</small>
```

#### 2.3 Contraste de Colores
```scss
// ✅ WCAG AA requiere ratio 4.5:1 para texto
// WCAG AAA requiere ratio 7:1

// Usar colores con suficiente contraste
$text-dark: #1a1a1a;      // Suficientemente oscuro
$text-light: #f5f5f5;     // Suficientemente claro
$link-color: #0056b3;     // Azul oscuro
$link-hover: #003d82;     // Más oscuro al hover
```

#### 2.4 Navigation y Skip Links
```html
<!-- ✅ Skip link para saltar a contenido principal -->
<a href="#main-content" class="skip-link">
  Saltar al contenido
</a>

<main id="main-content" role="main">
  <!-- Contenido principal -->
</main>

<style>
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
  }
  
  .skip-link:focus {
    top: 0;
  }
</style>
```

#### 2.5 ARIA Attributes
```html
<!-- ✅ Para modales -->
<div 
  role="dialog" 
  aria-labelledby="modal-title"
  aria-modal="true"
  aria-hidden="false"
>
  <h2 id="modal-title">Crear Usuario</h2>
  <!-- Contenido -->
</div>

<!-- ✅ Para desplegables -->
<button 
  aria-expanded="false"
  aria-controls="dropdown-menu"
  (click)="toggleDropdown()"
>
  Menú
</button>
<div id="dropdown-menu" [hidden]="!dropdownOpen">
  <!-- Items -->
</div>

<!-- ✅ Para carga -->
<div aria-live="polite" aria-busy="true" *ngIf="loading">
  Cargando datos...
</div>
```

---

## 3. PERFORMANCE Y SEO

### 3.1 Meta Tags Dinámicos
```typescript
// app.component.ts
constructor(
  private meta: Meta,
  private title: Title
) {}

ngOnInit() {
  this.title.setTitle('RepairHub - Sistema de Gestión');
  
  this.meta.addTag({
    name: 'description',
    content: 'Sistema profesional de gestión de reparaciones'
  });
  
  this.meta.addTag({
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  });
  
  this.meta.addTag({
    property: 'og:title',
    content: 'RepairHub'
  });
}
```

### 3.2 Lazy Loading de Rutas
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'users',
    // ✅ Se carga solo cuando se navega a /users
    loadChildren: () => 
      import('./features/users/users.routes')
        .then(m => m.USERS_ROUTES)
  },
  {
    path: 'orders',
    loadChildren: () => 
      import('./features/orders/orders.routes')
        .then(m => m.ORDERS_ROUTES)
  }
];
```

### 3.3 Lazy Loading de Imágenes
```typescript
// shared/directives/lazy-load.directive.ts
@Directive({
  selector: 'img[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit {
  @Input() appLazyLoad!: string;
  
  constructor(private el: ElementRef<HTMLImageElement>) {}
  
  ngOnInit() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.el.nativeElement.src = this.appLazyLoad;
            observer.unobserve(this.el.nativeElement);
          }
        });
      });
      observer.observe(this.el.nativeElement);
    } else {
      // Fallback para navegadores antiguos
      this.el.nativeElement.src = this.appLazyLoad;
    }
  }
}

// Uso
<img [appLazyLoad]="'assets/image.jpg'" alt="Descripción">
```

### 3.4 Change Detection OnPush
```typescript
// ✅ Mejora performance con OnPush
@Component({
  selector: 'app-user-card',
  template: `{{ user.name }}`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  @Input() user!: User;
}
```

### 3.5 Trackby en *ngFor
```typescript
// ❌ Evitar
<div *ngFor="let user of users">
  {{ user.name }}
</div>

// ✅ Bueno
<div *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</div>

trackByUserId(index: number, user: User) {
  return user.id;
}
```

### 3.6 RxJS Operators Eficientes
```typescript
// ✅ Evitar memory leaks
users$ = this.userService.getAll().pipe(
  // Cancelar requests anteriores
  switchMap(() => this.userService.getAll()),
  // Esperar cambios pero cancelar antiguos
  debounceTime(300),
  // Auto-desuscribirse
  shareReplay(1)
);

// En template usar async pipe
<div *ngFor="let user of users$ | async">
  {{ user.name }}
</div>
```

---

## 4. SEGURIDAD (Security)

### 4.1 Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.repairhub.local;
  frame-ancestors 'none';
"/>
```

### 4.2 XSS Prevention
```typescript
// ✅ Usar interpolación (segura por defecto)
<p>{{ user.name }}</p>

// ❌ NUNCA usar property binding con HTML
<p [innerHTML]="user.name"></p> <!-- INSEGURO si viene de usuario -->

// ✅ Si NECESITAS HTML, sanitizar
constructor(private sanitizer: DomSanitizer) {}

getSafeHtml(html: string) {
  return this.sanitizer.sanitize(SecurityContext.HTML, html);
}
```

### 4.3 CSRF Protection
```typescript
// ✅ Angular incluye CSRF automáticamente
// El backend debe validar el token CSRF

// En interceptor
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = this.getCsrfToken();
  if (token) {
    req = req.clone({
      setHeaders: { 'X-CSRF-Token': token }
    });
  }
  return next.handle(req);
}
```

### 4.4 JWT Seguro
```typescript
// ✅ Guardar JWT en httpOnly cookie (ideal)
// ✅ O usar localStorage con caution
// ❌ NUNCA guardar en sessionStorage

// Mejor práctica: httpOnly cookie desde backend
// El servidor establece: Set-Cookie: jwt=token; HttpOnly; Secure
```

---

## 5. PERFORMANCE CHECKLIST

### 5.1 Build Optimization
```bash
# ✅ Production build
ng build --configuration production

# ✅ Habilitar compression
ng build --aot --build-optimizer

# ✅ Analizar bundle size
ng build --stats-json
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/repairhubcoreui/stats.json
```

### 5.2 Lighthouse Goals
```
Métrica              Objetivo    Cómo Lograr
──────────────────────────────────────────────
First Contentful Paint (FCP)  < 1.8s      → Lazy loading
Largest Contentful Paint (LCP) < 2.5s     → Optimize images
Cumulative Layout Shift (CLS)  < 0.1      → Reserve space
Interaction to Next Paint (INP) < 200ms   → Optimize JS
```

### 5.3 CSS Optimization
```scss
// ✅ Usar variables CSS
:root {
  --primary-color: #0056b3;
  --spacing-unit: 8px;
}

.button {
  background-color: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);
}

// ✅ Minimizar CSS duplicado
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header {
  @include flex-center;
}
```

---

## 6. TESTING

### 6.1 Unit Tests
```typescript
// service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch users', () => {
    service.getAll().subscribe(users => {
      expect(users.length).toBe(2);
    });
    
    const req = http.expectOne('/api/users');
    req.flush([{ id: 1, name: 'Juan' }]);
  });
  
  afterEach(() => {
    http.verify();
  });
});
```

### 6.2 E2E Tests
```typescript
// app.e2e-spec.ts
describe('Users Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/users');
  });
  
  it('should display users list', () => {
    cy.get('[data-test="user-list"]').should('be.visible');
    cy.get('[data-test="user-item"]').should('have.length.greaterThan', 0);
  });
  
  it('should create new user', () => {
    cy.get('[data-test="create-button"]').click();
    cy.get('[data-test="name-input"]').type('Juan Pérez');
    cy.get('[data-test="email-input"]').type('juan@example.com');
    cy.get('[data-test="submit-button"]').click();
    cy.contains('Usuario creado exitosamente').should('be.visible');
  });
});
```

---

## 7. ACCESSIBILITY TESTING

```bash
# ✅ Herramientas de testing
npm install --save-dev @angular/cdk axe-core
npm install --save-dev cypress-axe

# ✅ En tests e2e
describe('Accessibility', () => {
  it('should not have accessibility violations', () => {
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

---

## 8. PWA (Progressive Web App)

### 8.1 Service Worker
```bash
# ✅ Generar service worker
ng add @angular/pwa

# ✅ Configuración en angular.json
"serviceWorker": true
```

### 8.2 Manifest
```json
// manifest.json
{
  "name": "RepairHub - Sistema de Gestión",
  "short_name": "RepairHub",
  "description": "Gestión profesional de reparaciones",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0056b3",
  "icons": [
    {
      "src": "assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 9. MONITORING Y ANALYTICS

```typescript
// shared/services/analytics.service.ts
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor() {
    // Google Analytics, Mixpanel, etc.
  }
  
  trackPageView(path: string) {
    // Log page view
  }
  
  trackEvent(action: string, category: string) {
    // Log evento
  }
}

// En router
router.events
  .pipe(filter(event => event instanceof NavigationEnd))
  .subscribe((event: any) => {
    this.analytics.trackPageView(event.url);
  });
```

---

## 10. DEPLOYMENT CHECKLIST

- [ ] Security headers configurados
- [ ] HTTPS/TLS activo
- [ ] CORS correctamente configurado
- [ ] Rate limiting activado
- [ ] Logging y monitoring
- [ ] Backups automáticos
- [ ] Cache headers configurados
- [ ] Compression (gzip) habilitado
- [ ] CDN para assets
- [ ] Database optimizada (índices)
- [ ] Error tracking (Sentry)
- [ ] Monitoring (New Relic, Datadog)

---

## 📊 Checklist para Lanzamiento

```
RESPONSIVO
- [ ] Mobile (< 600px)
- [ ] Tablet (600px - 960px)
- [ ] Desktop (> 960px)
- [ ] Landscape/Portrait
- [ ] Touch targets ≥ 44px

ACCESIBILIDAD
- [ ] WCAG 2.1 AA
- [ ] Keyboard navigation
- [ ] Screen reader tested
- [ ] Color contrast OK
- [ ] Semantic HTML

PERFORMANCE
- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Lighthouse > 80
- [ ] Bundle size < 1MB

SEGURIDAD
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] JWT secure
- [ ] HTTPS only
- [ ] Rate limiting

TESTING
- [ ] Unit tests > 80%
- [ ] E2E tests
- [ ] Cross-browser
- [ ] Mobile browser
- [ ] Load testing

SEO
- [ ] Meta tags
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Structured data
- [ ] 404 page
```

---

## 📚 Referencias

- [Web.dev Best Practices](https://web.dev/performance/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Security](https://angular.io/guide/security)
- [MDN Web Docs](https://developer.mozilla.org/)
- [OWASP Top 10](https://owasp.org/Top10/)
