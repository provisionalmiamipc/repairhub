# Guía de Implementación Rápida - 5 Módulos de CRUD

## Estado Actual
✅ **Refactorización de Servicios**: Todos 5 servicios ahora extienden `BaseService<T>`
- Orders ✅
- Customers ✅
- Employees ✅
- ServiceOrders ✅
- InventoryMovements ✅

## Pasos para Completar Cada Módulo

### Patrón a Seguir (Basado en Users)

#### 1. **Smart Components (Page Wrappers)**

```typescript
// ModuleListPageComponent
- Carga datos en ngOnInit: this.service.getAll()
- Expone: data$, loading$, error$ (del service)
- Funcionalidad: search, navigate, delete con confirmación

// ModuleFormPageComponent  
- Modo: new vs edit (detecta por route params)
- Carga por ID si es edit: this.service.getById(id)
- Submit: this.service.create() o update()

// ModuleDetailPageComponent
- Carga por ID: switchMap(params => this.service.getById(id))
- Solo lectura

// ModuleEditPageComponent
- Envoltura de FormPageComponent en modo edit
```

#### 2. **Dumb Components (Presentacionales)**

```typescript
// ModuleListComponent
- @Input modulesList: Module[]
- @Output selectModule, editModule, deleteModule
- Template: Table con CoreUI styling

// ModuleFormComponent
- @Input isEditMode: boolean
- Form con CustomValidators
- @Output submit, cancel

// ModuleDetailComponent
- @Input module: Module
- Mostrar datos en cards/details
```

#### 3. **Modelo y Validadores**

```typescript
// Modelo: src/app/shared/models/ModuleName.ts
- Interface principal
- CreateModuleDto
- UpdateModuleDto (incluir en FormComponent)

// Validadores: CustomValidators.ts
- Ya están creados en base.ts
```

#### 4. **Routing**

```typescript
// app.routes.ts
{
  path: 'module-name',
  component: ModuleListPageComponent,
  canActivate: [JwtUserGuard]
},
{
  path: 'module-name/new',
  component: ModuleFormPageComponent,
  canActivate: [JwtUserGuard]
},
{
  path: 'module-name/:id',
  component: ModuleDetailPageComponent,
  canActivate: [JwtUserGuard]
},
{
  path: 'module-name/:id/edit',
  component: ModuleEditPageComponent,
  canActivate: [JwtUserGuard]
}
```

## Prioridad de Implementación

1. **CRÍTICA**: ListPageComponent para cada módulo (80% del UI)
2. **ALTA**: FormPageComponent (crear/editar)
3. **MEDIA**: DetailPageComponent (lectura)
4. **BAJA**: Tests (funcionarán con servicios ya probados)

## Checklist por Módulo

Para cada uno de [Orders, Customers, Employees, ServiceOrders, InventoryMovements]:

- [ ] Smart Components: ListPage, FormPage, DetailPage, EditPage
- [ ] Dumb Components: List, Form, Detail
- [ ] Templates HTML con CoreUI
- [ ] Actualizar app.routes.ts con rutas
- [ ] Compilar: `ng build --configuration development`

## Línea de Comandos para Testing

```bash
# Compilar
ng build --configuration development

# Tests
npm test -- --watch=false --browsers=ChromeHeadless

# Servir localmente
ng serve --open
```

## Notas Importantes

- BaseService ya manejahttp, retry, timeout, error handling
- CustomValidators ya existen (9 validadores reutilizables)
- CoreUI disponible para styling
- ToastService y ConfirmDialogService ya implementados
- Smart/Dumb pattern facilita testing futuro

## Estimación de Tiempo

- Cada módulo: 20-30 min
- 5 módulos: 2-2.5 horas
- Total con testing: 3-4 horas
