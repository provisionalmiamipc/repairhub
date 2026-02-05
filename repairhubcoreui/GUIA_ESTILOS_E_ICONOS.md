# GUÍA RÁPIDA: Estilos e Iconos

## 📂 Estructura creada

```
src/
├── scss/
│   ├── styles.scss                 ← Punto de entrada (carga todo)
│   ├── _variables-mixins.scss      ← Variables y mixins globales (NEW)
│   ├── _theme.scss                 ← Tema personalizado
│   ├── _custom.scss                ← Estilos custom
│   ├── _charts.scss                ← Estilos de gráficos
│   └── ... otros archivos
│
└── assets/
    └── icons/                      ← Iconos SVG locales (NEW)
        └── README.md
```

## 🎨 Cómo usar en tus componentes

### 1. **Usar clases de Bootstrap directamente** (Recomendado)

```html
<!-- En template -->
<div class="container mt-5 mb-3">
  <div class="row">
    <div class="col-md-6">
      <button class="btn btn-primary btn-lg">Guardar</button>
    </div>
  </div>
</div>
```

### 2. **Acceder a variables globales en SCSS**

```scss
// En mi-componente.component.scss

// Las variables están disponibles automáticamente:
.card {
  padding: $spacing-md;
  background-color: $light;
  border-radius: $border-radius-lg;
  
  @include shadow-on-hover();
  
  @include media-query(md) {
    padding: $spacing-lg;
  }
}
```

### 3. **Usar Mixins predefinidos**

```scss
// Flexbox centrado
.centered-content {
  @include flex-center();
  height: 100vh;
}

// Texto truncado
.truncate-text {
  @include text-truncate();
}

// Botón base
.custom-button {
  @include button-base();
  background-color: $primary;
  color: white;
  
  &:hover {
    background-color: darken($primary, 10%);
  }
}

// Media queries responsive
.responsive-box {
  padding: $spacing-sm;
  
  @include media-query(lg) {
    padding: $spacing-lg;
  }
}
```

### 4. **Usar Bootstrap Icons (CDN)**

```html
<!-- Iconos sin necesidad de importar nada -->
<button class="btn btn-primary">
  <i class="bi bi-check-circle me-2"></i>
  Confirmar
</button>

<span class="text-danger">
  <i class="bi bi-x-circle"></i>
</span>
```

Más iconos: https://icons.getbootstrap.com/

### 5. **Usar iconos SVG locales**

```html
<!-- Si tienes iconos en src/assets/icons/ -->
<img src="assets/icons/mi-icono.svg" alt="Mi icono" class="icon">
```

```scss
.icon {
  width: 24px;
  height: 24px;
  filter: brightness(0) saturate(100%) invert(34%) sepia(39%) saturate(1365%) hue-rotate(246deg);
}
```

## 📊 Variables disponibles

### Colores
```scss
$primary, $secondary, $success, $danger, $warning, $info, $light, $dark
```

### Espaciado
```scss
$spacing-xs (0.25rem)
$spacing-sm (0.5rem)
$spacing-md (1rem)
$spacing-lg (1.5rem)
$spacing-xl (2rem)
$spacing-2xl (3rem)
```

### Tipografía
```scss
$font-size-base (1rem)
$font-size-sm (0.875rem)
$font-size-lg (1.125rem)
```

### Bordes
```scss
$border-radius-sm, $border-radius-md, $border-radius-lg
$box-shadow-sm, $box-shadow-md, $box-shadow-lg
```

### Breakpoints
```scss
$breakpoint-xs (0)
$breakpoint-sm (576px)
$breakpoint-md (768px)
$breakpoint-lg (992px)
$breakpoint-xl (1200px)
$breakpoint-2xl (1400px)
```

## 🚀 Mejores prácticas

✅ **Haz:**
- Usa clases Bootstrap en templates
- Importa variables en archivos `.scss` de componentes
- Usa mixins para código repetido
- Personaliza colores en `_theme.scss` si necesitas cambios globales

❌ **Evita:**
- CSS inline en templates
- Crear archivos `.css` nuevos (usa `.scss`)
- Hardcodear colores (usa las variables)
- Duplicar estilos (usa mixins)

## 📝 Ejemplo completo

```typescript
// users-list.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-users-list',
  template: `
    <div class="users-container">
      <h1>Lista de usuarios</h1>
      <button class="btn btn-primary btn-lg mb-3">
        <i class="bi bi-plus-circle me-2"></i>
        Nuevo usuario
      </button>
      <div class="users-grid">
        <!-- Contenido -->
      </div>
    </div>
  `,
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent { }
```

```scss
// users-list.component.scss
@use '../../scss/variables-mixins' as *;

.users-container {
  padding: $spacing-lg;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: $primary;
    margin-bottom: $spacing-lg;
    font-size: 2rem;
  }
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;

  @include media-query(md) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
```

¡Listo! Ahora tienes una estructura de estilos profesional y organizada. 🎉
