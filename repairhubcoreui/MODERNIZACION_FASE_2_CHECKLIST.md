# 🎨 Modernización CRUD Angular 2026 - Fase 2: Checklist de Replicación

**Estado:** Plantillas creadas ✅ | Documentación lista ✅ | Listos para replicar en otros CRUDs

**Fecha:** Enero 2025
**Versión:** 2.0 (Con checklist preciso)

---

## 📋 Tabla de Contenidos

1. [Quick Start](#quick-start)
2. [CRUDs Pendientes](#cruds-pendientes)
3. [Checklist por CRUD](#checklist-por-crud)
4. [Comando Rápido Copy-Paste](#comando-rápido-copy-paste)
5. [Validación Final](#validación-final)

---

## 🚀 Quick Start

### Paso 1: Copiar Archivos Base

```bash
# Copiar empleado como template
cp src/app/features/employees/employees-list-modern.component.ts \
   src/app/features/[FEATURE]/[feature]-list-modern.component.ts

cp src/app/features/employees/employees-list-modern.component.html \
   src/app/features/[FEATURE]/[feature]-list-modern.component.html

cp src/app/features/employees/employees-list-modern.component.scss \
   src/app/features/[FEATURE]/[feature]-list-modern.component.scss

# Idem para formulario
cp src/app/features/employees/employees-form-modern.component.ts \
   src/app/features/[FEATURE]/[feature]-form-modern.component.ts

cp src/app/features/employees/employees-form-modern.component.html \
   src/app/features/[FEATURE]/[feature]-form-modern.component.html

cp src/app/features/employees/employees-form-modern.component.scss \
   src/app/features/[FEATURE]/[feature]-form-modern.component.scss
```

### Paso 2: Reemplazar palabras clave

**En TypeScript:**
```bash
sed -i 's/employees/[FEATURE]/g' src/app/features/[FEATURE]/*.ts
sed -i 's/Employees/[Model]/g' src/app/features/[FEATURE]/*.ts
sed -i 's/EmployeesService/[Model]Service/g' src/app/features/[FEATURE]/*.ts
sed -i 's/EmployeeListState/[Model]ListState/g' src/app/features/[FEATURE]/*.ts
```

**En HTML:**
```bash
sed -i 's/empleados/[feature-label]/g' src/app/features/[FEATURE]/*.html
sed -i 's/Empleados/[Feature-Label]/g' src/app/features/[FEATURE]/*.html
sed -i 's/employee/[model-singular]/g' src/app/features/[FEATURE]/*.html
```

---

## 📊 CRUDs Pendientes

| # | CRUD | Modelo | Campos Clave | Prioridad | Estado |
|---|------|--------|--------------|-----------|--------|
| 1 | 🏢 Centers | Centers | name, address, phone, isActive | 🔴 Alta | ⏳ Pendiente |
| 2 | 🏪 Stores | Stores | name, centerId, address, isActive | 🔴 Alta | ⏳ Pendiente |
| 3 | 📦 Items | Items | name, description, sku, itemType, quantity | 🔴 Alta | ⏳ Pendiente |
| 4 | 💰 Prices | Prices | itemId, price, startDate, endDate | 🟡 Media | ⏳ Pendiente |
| 5 | 🏷️ Item Types | ItemTypes | name, description | 🟡 Media | ⏳ Pendiente |
| 6 | 📱 Device Brands | DeviceBrands | name, description | 🟡 Media | ⏳ Pendiente |
| 7 | 🔧 Devices | Devices | name, brand, model, imei | 🟡 Media | ⏳ Pendiente |
| 8 | 🛠️ Repair Status | RepairStatus | name, description, color | 🟡 Media | ⏳ Pendiente |
| 9 | 💳 Payment Types | PaymentTypes | name, description | 🟡 Media | ⏳ Pendiente |
| 10 | 📋 Orders | Orders | orderNum, customer, total, status | 🟢 Baja | ⏳ Pendiente |
| 11 | 🧾 Service Orders | ServiceOrders | soNumber, status, priority | 🟢 Baja | ⏳ Pendiente |
| 12 | 📝 Appointments | Appointments | date, time, customer, status | 🟢 Baja | ⏳ Pendiente |
| 13 | 👥 Customers | Customers | name, email, phone, address | 🔴 Alta | ⏳ Pendiente |
| 14 | 📦 Inventory Movements | InventoryMovements | type, itemId, quantity, date | 🟡 Media | ⏳ Pendiente |
| 15 | 🔐 Notifications | Notifications | type, message, read | 🟢 Baja | ⏳ Pendiente |

**Total: 15 CRUDs → Aprox 45 componentes (list + form + detail)**

---

## ✅ Checklist por CRUD

### Template CENTERS

#### [ ] TypeScript (centers-list-modern.component.ts)

- [ ] Cambiar `Employees` → `Centers`
- [ ] Cambiar `EmployeesService` → `CentersService`
- [ ] Actualizar interfaz `ListState`:
  ```typescript
  interface CenterListState {
    items: Centers[];
    loading: boolean;
    error: string | null;
    searchQuery: string;
    selectedFilters: {
      isActive?: boolean;  // ✅ Campo específico
    };
  }
  ```
- [ ] Actualizar `filteredItems` computed:
  ```typescript
  filteredItems = computed(() => {
    const items = this.items();
    const query = this.searchQuery().toLowerCase();
    const filters = this.state().selectedFilters;

    return items.filter(center => {
      const matchesSearch =
        center.name.toLowerCase().includes(query) ||
        center.address?.toLowerCase().includes(query) ||
        center.phone?.toLowerCase().includes(query);

      const matchesActive = filters.isActive === undefined || 
        center.isActive === filters.isActive;

      return matchesSearch && matchesActive;
    });
  });
  ```
- [ ] Actualizar `stats` computed:
  ```typescript
  stats = computed(() => ({
    total: this.items().length,
    filtered: this.filteredItems().length,
    active: this.items().filter(c => c.isActive).length,
    inactive: this.items().filter(c => !c.isActive).length,
  }));
  ```
- [ ] Actualizar métodos:
  ```typescript
  filterByStatus(value: boolean | null): void {
    this.state.update(s => ({
      ...s,
      selectedFilters: { 
        ...s.selectedFilters, 
        isActive: value === null ? undefined : value 
      }
    }));
  }
  ```
- [ ] Actualizar helpers:
  ```typescript
  getStoreCount(center: Centers): number {
    return center.stores?.length || 0;
  }
  
  getEmployeeCount(center: Centers): number {
    return center.employees?.length || 0;
  }
  ```

#### [ ] HTML (centers-list-modern.component.html)

- [ ] Cambiar títulos: "Centros" en lugar de "Empleados"
- [ ] Actualizar stats cards:
  ```html
  <div class="stat-card accent-primary">{{ stats().active }} Activos</div>
  <div class="stat-card accent-secondary">{{ stats().inactive }} Inactivos</div>
  ```
- [ ] Actualizar filtro de estado:
  ```html
  <select (change)="filterByStatus(
    $event.target.value === 'true' ? true : 
    $event.target.value === 'false' ? false : null
  )">
    <option value="">Todos</option>
    <option value="true">Activos</option>
    <option value="false">Inactivos</option>
  </select>
  ```
- [ ] Actualizar card header:
  ```html
  <div class="header-info">
    <h3 class="center-name">{{ center.name }}</h3>
    <span class="center-code">{{ center.address }}</span>
  </div>
  @if (center.isActive) {
    <div class="badge-active">✓ Activo</div>
  } @else {
    <div class="badge-inactive">✕ Inactivo</div>
  }
  ```
- [ ] Actualizar card body:
  ```html
  <div class="info-row">
    <div class="info-group">
      <label class="info-label">Teléfono</label>
      <a href="tel:{{ center.phone }}">{{ center.phone }}</a>
    </div>
    <div class="info-group">
      <label class="info-label">Dirección</label>
      <span>{{ center.address }}</span>
    </div>
  </div>
  <div class="info-row">
    <div class="info-group">Tiendas: {{ getStoreCount(center) }}</div>
    <div class="info-group">Empleados: {{ getEmployeeCount(center) }}</div>
  </div>
  ```

#### [ ] SCSS (centers-list-modern.component.scss)

- [ ] Cambiar import (ya está correcto): `@import '../../scss/modern-design-system.scss';`
- [ ] Cambiar class names si es necesario: `.centers-container`, `.centers-grid`, `.center-card`
- [ ] Cambiar colores de badge si se desea (mantener primary para activos):
  ```scss
  .badge-active { 
    background: rgba($success, 0.15); 
    color: $success; 
  }
  .badge-inactive { 
    background: rgba($warning, 0.15); 
    color: $warning; 
  }
  ```

### Template STORES (igual que Centers pero con relación)

#### [ ] TypeScript

- [ ] Crear `StoreListState` interface con `centerId` y `status` en filters
- [ ] Computed `storesByCenterAndStatus` para relación
- [ ] Stats: total, filtered, active, inactive

#### [ ] HTML

- [ ] Dropdown de Centers antes del búsqueda
- [ ] Card mostrando: name, center relation, status, employee count
- [ ] Badges: Activo/Inactivo

#### [ ] SCSS

- [ ] Mismo design system
- [ ] Color accent secundaria para stores

---

### Template ITEMS

#### [ ] TypeScript

```typescript
interface ItemListState {
  items: Items[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedFilters: {
    itemTypeId?: number;
    inStock?: boolean;
  };
}

filteredItems = computed(() => {
  const items = this.items();
  const query = this.searchQuery().toLowerCase();
  const filters = this.state().selectedFilters;

  return items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query);

    const matchesType = filters.itemTypeId === undefined || 
      item.itemTypeId === filters.itemTypeId;

    const matchesStock = filters.inStock === undefined || 
      (item.quantity > 0) === filters.inStock;

    return matchesSearch && matchesType && matchesStock;
  });
});

stats = computed(() => ({
  total: this.items().length,
  filtered: this.filteredItems().length,
  inStock: this.items().filter(i => i.quantity > 0).length,
  outOfStock: this.items().filter(i => i.quantity === 0).length,
  totalValue: this.items().reduce((sum, i) => sum + (i.price * i.quantity), 0)
}));
```

#### [ ] HTML

- [ ] Dropdown para ItemTypes
- [ ] Checkbox "Solo en Stock"
- [ ] Cards con: name, sku, type badge, quantity indicator, price
- [ ] Empty state: "No hay items"

#### [ ] SCSS

- [ ] Badge rojo si out of stock
- [ ] Badge verde si in stock
- [ ] Cantidad visualmente prominente

---

## 💻 Comando Rápido Copy-Paste

### CENTERS (Ejemplo completo)

```bash
#!/bin/bash
FEATURE="centers"
FEATURE_UPPER="Centers"

# Copiar
cp src/app/features/employees/employees-list-modern.component.ts \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.ts

cp src/app/features/employees/employees-list-modern.component.html \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.html

cp src/app/features/employees/employees-list-modern.component.scss \
   src/app/features/$FEATURE/$FEATURE-list-modern.component.scss

# Reemplazar
sed -i "s/employees/$FEATURE/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts
sed -i "s/Employees/$FEATURE_UPPER/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts
sed -i "s/EmployeesService/${FEATURE_UPPER}Service/g" src/app/features/$FEATURE/$FEATURE-list-modern.component.ts

# Compilar
ng build

echo "✅ $FEATURE completado. Revisar en: src/app/features/$FEATURE/"
```

---

## 🔍 Validación Final

### Antes de hacer commit:

- [ ] Compilar: `ng build` (sin errores)
- [ ] Servir: `ng serve` (sin warnings)
- [ ] Revisar en navegador:
  - [ ] Listado aparece
  - [ ] Búsqueda funciona
  - [ ] Filtros funcionan
  - [ ] Animaciones suaves
  - [ ] Responsive (mobile/tablet/desktop)
  - [ ] Dark mode correcto
  - [ ] Botones son clicables

### Checklist de CSS:

- [ ] Import de `_modern-design-system.scss`
- [ ] Variables de color correctas
- [ ] Glassmorphism visible
- [ ] Shadows aplicadas
- [ ] Grid responsive

### Checklist de TypeScript:

- [ ] Service inyectado correctamente
- [ ] Signals sin errores
- [ ] Computed properties reactivas
- [ ] Outputs funcionando
- [ ] ngOnInit() llama loadData()

### Checklist de HTML:

- [ ] @if/@for/@switch correctos (no *ngIf/*ngFor)
- [ ] track en @for
- [ ] No hay bindings rotos
- [ ] Animaciones aplicadas
- [ ] Textos en español

---

## 📅 Plan de Implementación Sugerido

**Semana 1:**
- Lunes-Martes: Centers ✅
- Miércoles: Stores ✅
- Jueves: Items ✅
- Viernes: Testing & fixes

**Semana 2:**
- Devices, DeviceBrands, ItemTypes
- Prices, PaymentTypes, RepairStatus
- Testing de relaciones (FK)

**Semana 3:**
- Orders, ServiceOrders, Appointments
- Customers, InventoryMovements, Notifications
- Validación final de todas las pantallas

**Semana 4:**
- Funcionalidades avanzadas:
  - Paginación
  - Real-time search
  - Filtros guardados
  - Exportación a CSV
  - Bulk actions
  
---

## 🔗 Links Útiles

- **Guía Base:** `MODERNIZACION_CRUD_GUIA.md`
- **Resumen:** `MODERNIZACION_RESUMEN.md`
- **Design System:** `src/scss/_modern-design-system.scss`
- **Template List:** `src/app/features/employees/employees-list-modern.component.*`
- **Template Form:** `src/app/features/employees/employees-form-modern.component.*`

---

## ❓ FAQ

**P: ¿Puedo modificar los colores?**
R: Sí. En `_modern-design-system.scss` edita variables como `$primary`, `$info`, `$success`.

**P: ¿Y si el CRUD tiene campos específicos?**
R: Copia el template y añade/quita campos tanto en TypeScript como HTML.

**P: ¿Cómo añado validaciones personalizadas?**
R: En el formulario moderno, en el `createForm()` método, añade validadores al FormBuilder.

**P: ¿Y relaciones FK?**
R: En computed como `filteredStores = computed(() => { return this.stores.filter(...) })`.

**P: ¿Necesito cambiar los servicios?**
R: No, solo inyéctalo (e.g., `CentersService`) en el constructor.

---

**Estado:** Listo para replicación en todos los CRUDs 🚀
