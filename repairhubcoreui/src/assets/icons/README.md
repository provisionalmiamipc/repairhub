# Guía de Estilos e Iconos

## 📦 Estructura de Estilos

Los estilos están centralizados en `/src/scss/` y se cargan automáticamente:

### Archivos principales:
- **`styles.scss`** - Punto de entrada que importa todo
- **`_bootstrap`** - Bootstrap base (importado automáticamente)
- **`_coreui`** - CoreUI components (importado automáticamente)
- **`_theme.scss`** - Variables de tema personalizadas
- **`_custom.scss`** - Estilos custom del proyecto
- **`_charts.scss`** - Estilos para gráficos
- **`_scrollbar.scss`** - Personalizacion de scrollbar

### Configuración en `angular.json`:
```json
"styles": [
  "src/scss/styles.scss",
  "node_modules/bootstrap-icons/font/bootstrap-icons.scss"
]
```

## 🎨 Como usar Bootstrap

Bootstrap está importado en `styles.scss` via `@use 'bootstrap/scss/bootstrap'`.

Puedes usar las clases de Bootstrap directamente en tus templates:

```html
<div class="container mt-5">
  <div class="row">
    <div class="col-md-6">
      <button class="btn btn-primary">Click me</button>
    </div>
  </div>
</div>
```

## 🔤 Iconos

### Opción 1: Bootstrap Icons (CDN - Recomendado)
Ya está cargado desde CDN en `styles.scss`:

```html
<i class="bi bi-house"></i>
<i class="bi bi-check-circle"></i>
<i class="bi bi-x-circle"></i>
```

Más iconos: https://icons.getbootstrap.com/

### Opción 2: Iconos SVG locales
Coloca tus iconos SVG en `/src/assets/icons/`:

```html
<img src="assets/icons/mi-icono.svg" alt="Mi icono">
```

### Opción 3: CoreUI Icons
CoreUI también proporciona iconos, úsalos en componentes:

```typescript
import { cilHome, cilSettings } from '@coreui/icons';

// En el componente
icons = {
  cilHome,
  cilSettings
};
```

```html
<svg cxIconName="cilHome"></svg>
```

## 📝 Variables de tema

Personaliza los colores en `_theme.scss`:

```scss
$primary: #0066cc;
$secondary: #6c757d;
$success: #28a745;
// etc...
```

Los cambios se aplican automáticamente a Bootstrap y CoreUI.

## ✨ Buenas prácticas

1. **No crees nuevos archivos CSS**, usa SCSS
2. **Importa variables desde `_theme.scss`** en tus componentes
3. **Usa clases de Bootstrap** en lugar de CSS custom cuando sea posible
4. **Mantén los estilos component-specific en el `*.scss` del componente**
