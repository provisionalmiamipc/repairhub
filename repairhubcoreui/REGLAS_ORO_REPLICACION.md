# 🎯 Las 10 Reglas de Oro para Replicar CRUDs Modernos

**Propósito:** Guía ultra-rápida para implementar modernización en cualquier CRUD en <30 minutos

---

## ✨ Regla 1: Estructura de Carpetas

Cada CRUD moderno tiene exactamente **6 archivos**:

```
src/app/features/[feature]/
├── [feature]-list-modern.component.ts       (280 líneas ≈)
├── [feature]-list-modern.component.html     (230 líneas ≈)
├── [feature]-list-modern.component.scss     (650 líneas ≈)
├── [feature]-form-modern.component.ts       (320 líneas ≈)
├── [feature]-form-modern.component.html     (560 líneas ≈)
└── [feature]-form-modern.component.scss     (720 líneas ≈)
```

**Nota:** Reemplaza `[feature]` con el nombre en minúsculas (employees, centers, stores, etc.)

---

## ✨ Regla 2: TypeScript - Estructura Base

Todos siguen este patrón **exacto**:

```typescript
import { Component, signal, computed, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

interface [Model]ListState {
  items: [Model][];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilters: { /* ... */ };  // ← Varía por CRUD
}

@Component({
  selector: 'app-[feature]-list-modern',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './[feature]-list-modern.component.html',
  styleUrls: ['./[feature]-list-modern.component.scss'],
  animations: [/* triggers */]
})
export class [Model]ListModernComponent implements OnInit {
  
  // 1️⃣ SIGNALS
  private readonly state = signal<[Model]ListState>({...});
  
  // 2️⃣ COMPUTEDS
  items = computed(() => this.state().items);
  filteredItems = computed(() => { /* lógica */ });
  stats = computed(() => ({ /* estadísticas */ }));
  isEmpty = computed(() => /* ... */);
  
  // 3️⃣ OUTPUTS
  selectItem = output<[Model]>();
  editItem = output<[Model]>();
  deleteItem = output<[Model]>();
  createNew = output<void>();
  
  constructor(private service: [Model]Service) {}
  
  ngOnInit(): void { this.loadData(); }
  
  // 4️⃣ MÉTODOS
  private loadData(): void { /* ... */ }
  updateSearch(q: string): void { /* ... */ }
  filterBy(...): void { /* ... */ }
  onDelete(...): void { /* ... */ }
  onRefresh(): void { /* ... */ }
  
  // 5️⃣ HELPERS
  getLabel(...): string { /* ... */ }
  getColor(...): string { /* ... */ }
}
```

---

## ✨ Regla 3: HTML - Control Flow (No NgIf/NgFor)

**CORRECTO ✅:**
```html
@if (loading()) {
  <div class="skeleton-grid">
    @for (_ of [1, 2, 3]; track $index) {
      <div class="skeleton"></div>
    }
  </div>
}

@if (isEmpty()) {
  <div class="empty-state">Vacío</div>
}

@if (!isEmpty() && !loading()) {
  <div class="grid">
    @for (item of filteredItems(); track item.id) {
      <div class="card" @cardEnter>{{ item.name }}</div>
    }
  </div>
}
```

**INCORRECTO ❌:**
```html
<!-- NO HAGAS ESTO -->
<div *ngIf="loading">
  <div *ngFor="let x of data">{{ x }}</div>
</div>
```

---

## ✨ Regla 4: SCSS - Siempre Importa Design System

**Primeras 2 líneas OBLIGATORIAS:**
```scss
@import '../../scss/modern-design-system.scss';

// Luego tus estilos...
```

**Usa variables predefinidas:**
```scss
// ✅ CORRECTO
.my-card {
  @include glass-card;
  padding: map-get($spacing, 'lg');
  color: $dark-text-primary;
  border-radius: $radius-lg;
}

// ❌ INCORRECTO (hardcoded)
.my-card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(71, 85, 105, 0.4);
  padding: 1rem;
  color: #f1f5f9;
}
```

---

## ✨ Regla 5: Campos por CRUD

Cada modelo tiene diferentes campos en filtros. **Adapta solo esto:**

### EMPLOYEES
```typescript
selectedFilters: { employee_type?: string; isCenterAdmin?: boolean; }
```

### CENTERS
```typescript
selectedFilters: { isActive?: boolean; }
```

### STORES
```typescript
selectedFilters: { centerId?: number; isActive?: boolean; }
```

### ITEMS
```typescript
selectedFilters: { itemTypeId?: number; inStock?: boolean; }
```

### CUSTOMERS
```typescript
selectedFilters: { city?: string; hasOrders?: boolean; }
```

---

## ✨ Regla 6: Stats Card - Personaliza por CRUD

**Employees:**
```typescript
stats = computed(() => ({
  total: this.items().length,
  filtered: this.filteredItems().length,
  experts: this.items().filter(e => e.employee_type === 'Expert').length,
  accountants: this.items().filter(e => e.employee_type === 'Accountant').length,
}));
```

**Centers:**
```typescript
stats = computed(() => ({
  total: this.items().length,
  active: this.items().filter(c => c.isActive).length,
  inactive: this.items().filter(c => !c.isActive).length,
}));
```

**Items:**
```typescript
stats = computed(() => ({
  total: this.items().length,
  inStock: this.items().filter(i => i.quantity > 0).length,
  outOfStock: this.items().filter(i => i.quantity === 0).length,
}));
```

---

## ✨ Regla 7: Badges y Colores

**Inyecta clase de color en la card:**

```html
<div class="badge" [class]="'badge-' + getTypeColor(item.type)">
  {{ getTypeLabel(item.type) }}
</div>
```

**En TS:**
```typescript
getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    'Expert': 'primary',
    'Accountant': 'info',
    'AdminStore': 'warning',
    'User': 'secondary'
  };
  return colorMap[type] || 'default';
}

getTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    'Expert': '🔧 Experto',
    'Accountant': '💼 Contador',
    'AdminStore': '🏪 Admin Tienda',
    'User': '👤 Usuario'
  };
  return labelMap[type] || type;
}
```

**En SCSS:**
```scss
.badge-primary { background: rgba($primary, 0.15); color: $primary; }
.badge-info { background: rgba($info, 0.15); color: $info; }
.badge-warning { background: rgba($warning, 0.15); color: $warning; }
.badge-success { background: rgba($success, 0.15); color: $success; }
.badge-danger { background: rgba($danger, 0.15); color: $danger; }
```

---

## ✨ Regla 8: Validación de Campos

En formularios, **siempre usa este patrón:**

```html
<div class="form-group">
  <label class="form-label">
    Nombre <span class="required">*</span>
  </label>
  
  <div class="input-wrapper">
    <input
      type="text"
      class="form-input"
      [class.is-error]="hasError('fieldName')"
      [class.is-valid]="isFieldValid('fieldName')"
      formControlName="fieldName"
      placeholder="Ej: Valor"
    />
    @if (isFieldValid('fieldName')) {
      <span class="input-icon success">✓</span>
    }
  </div>
  
  @if (hasError('fieldName')) {
    <div class="error-text" @fieldError>
      {{ getFieldError('fieldName') }}
    </div>
  }
  
  <div class="help-text">Descripción de ayuda</div>
</div>
```

---

## ✨ Regla 9: Animaciones - Usa Triggers Predefinidos

**SIEMPRE usamos estos 3 triggers:**

```typescript
animations: [
  trigger('cardEnter', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
        style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),
  
  trigger('stepSlide', [
    transition('* => *', [
      style({ opacity: 0, transform: 'translateX(20px)' }),
      animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
        style({ opacity: 1, transform: 'translateX(0)' }))
    ])
  ]),
  
  trigger('fieldError', [
    transition(':enter', [
      style({ opacity: 0, height: 0 }),
      animate('200ms ease-out', style({ opacity: 1, height: '*' }))
    ])
  ])
]
```

**En HTML:**
```html
<div class="card" @cardEnter>{{ item.name }}</div>
<div class="form-step" @stepSlide>{{ step }}</div>
<div class="error-text" @fieldError>Error</div>
```

---

## ✨ Regla 10: Validación Final - Checklist de 5 Minutos

Antes de hacer `ng build`:

- [ ] `selector: 'app-[feature]-list-modern'` ✓
- [ ] `imports: [CommonModule, FormsModule]` ✓
- [ ] `standalone: true` ✓
- [ ] `templateUrl: './[feature]-list-modern.component.html'` ✓
- [ ] `styleUrls: ['./[feature]-list-modern.component.scss']` ✓
- [ ] `@import '../../scss/modern-design-system.scss';` en SCSS ✓
- [ ] NO hay `*ngIf`, `*ngFor` en HTML (solo `@if`, `@for`) ✓
- [ ] Todos los `@for` tienen `track` ✓
- [ ] `ngOnInit()` existe y llama `loadData()` ✓
- [ ] Service inyectado en constructor ✓
- [ ] No hay `console.log()` o `debugger` ✓

---

## 🔧 Comando para Replicar (Copy-Paste)

```bash
# 1. Configurar variables
FEATURE="centers"          # Reemplaza con tu feature
MODEL="Centers"            # Reemplaza con tu modelo (CamelCase)
SERVICE="CentersService"   # Reemplaza con tu servicio

# 2. Copiar archivos
mkdir -p src/app/features/$FEATURE
cp src/app/features/employees/employees-list-modern.component.ts \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.ts
cp src/app/features/employees/employees-list-modern.component.html \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.html
cp src/app/features/employees/employees-list-modern.component.scss \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.scss

# 3. Reemplazar nombres
sed -i "s/Employees/$MODEL/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts
sed -i "s/EmployeesService/$SERVICE/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts
sed -i "s/EmployeesListModern/${MODEL}ListModern/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts

# 4. Compilar
ng build

# 5. Si OK → Commit ✓
echo "✅ $FEATURE modernizado correctamente"
```

---

## 📊 Matriz de Decisión Rápida

| Pregunta | Respuesta | Aplica en... |
|----------|-----------|-------------|
| ¿Usar *ngIf o @if? | **@if** siempre | HTML templates |
| ¿Usar *ngFor o @for? | **@for** siempre | HTML templates |
| ¿Track en @for? | **track item.id** | Siempre |
| ¿Hardcoded colors? | **NO** usa variables | SCSS |
| ¿Qué mixin? | **glass-card** base | Todas las cards |
| ¿Spacing? | `map-get($spacing, 'lg')` | Padding/margin |
| ¿Border radius? | `$radius-lg` | Cards, inputs |
| ¿Import design? | **Primera línea SCSS** | Todos los estilos |
| ¿Service? | Inyecta en constructor | Lista + Formulario |
| ¿Animación? | Usa predefinidos (Regla 9) | Enter + Slide + Error |

---

## 🚀 Tiempo Estimado

- **Primera réplica (Centers):** 45 minutos
- **Segunda (Stores):** 30 minutos
- **Tercera+ (Items, etc.):** 20 minutos cada una

**Total para 15 CRUDs:** ~4 horas

---

## ❓ Troubleshooting Rápido

**Error: "standalone" no se reconoce**
→ Verifica versión Angular: `ng --version` debe ser 20+

**Error: @for sin track**
→ Añade: `@for (...; track item.id)`

**Estilos no cargan**
→ Verifica import: `@import '../../scss/modern-design-system.scss';` **primera línea**

**Búsqueda no filtra**
→ Verifica que `updateSearch()` actualiza `state()` y `filteredItems` lee el estado

**Animaciones no funcionan**
→ Verifica que en el HTML está: `@cardEnter`, `@stepSlide`, etc.

---

**Última actualización:** Enero 2025  
**Versión:** 2.0 Final  
**Estado:** Listo para replicación masiva 🚀
