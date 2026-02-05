# ⚡ Quick Start - Estilos e Iconos (30 segundos)

## Lo que se hizo

✅ Bootstrap importado  
✅ Bootstrap Icons (local, sin CDN)  
✅ Variables SCSS globales  
✅ Mixins reutilizables  
✅ Carpeta de iconos SVG lista  

## Úsalo ahora

### En templates HTML
```html
<!-- Icono -->
<i class="bi bi-house"></i>

<!-- Botón Bootstrap -->
<button class="btn btn-primary">Guardar</button>

<!-- Grid responsive -->
<div class="container">
  <div class="row">
    <div class="col-md-6">Contenido</div>
  </div>
</div>
```

### En archivos SCSS
```scss
.mi-clase {
  // Variables
  padding: $spacing-md;
  color: $primary;
  background: $light;
  border-radius: $border-radius-md;
  
  // Mixins
  @include shadow-on-hover();
  
  // Responsive
  @include media-query(lg) {
    padding: $spacing-lg;
  }
}
```

## Variables disponibles
- Colores: `$primary`, `$secondary`, `$success`, `$danger`, `$warning`, `$info`, `$light`, `$dark`
- Espaciado: `$spacing-xs`, `$spacing-sm`, `$spacing-md`, `$spacing-lg`, `$spacing-xl`, `$spacing-2xl`
- Mixins: `@include flex-center()`, `@include text-truncate()`, `@include shadow-on-hover()`, `@include media-query(breakpoint)`, `@include button-base()`

## Más iconos
🔗 https://icons.getbootstrap.com/

## Documentación completa
📖 Lee: `SETUP_ESTILOS_ICONOS_FINAL.md`

---

**¡Listo! Ahora usa los estilos en tus componentes.** 🚀
