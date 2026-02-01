# 🔒 ANÁLISIS DE SEGURIDAD - Sistema RBAC

## 🚨 PROBLEMA IDENTIFICADO

### Rol USER (Administrador del Sistema)
**Estado Actual:** ❌ Acceso TOTAL a TODO
- Tiene **TODOS** los permisos disponibles (incluyendo DELETE_USER)
- No hay restricción en qué usuarios/centros/tiendas puede gestionar
- Riesgo: Un usuario USER comprometido = acceso total al sistema

---

## 🎯 MATRIZ DE PERMISOS RECOMENDADA

### 1. **USER** (Super Administrador)
**Nivel:** Sistema Completo
**Restricción:** Solo acceso a su propio Centro + Gestión de centros

```
✅ Permitido:
  - Ver/Crear/Editar/Eliminar Centros (GLOBAL)
  - Ver/Crear/Editar Empleados (de su centro)
  - Ver/Crear/Editar Tiendas (de su centro)
  - Ver/Crear/Editar Clientes (de su centro)
  - Ver Órdenes/Ventas/Reportes (de su centro)
  - Ver/Crear Citas (de su centro)

❌ Prohibido:
  - NO puede Eliminar USUARIOS
  - NO puede ver/editar datos de otros centros
  - NO puede editar su propio perfil (requiere admin específico)
```

### 2. **EMPLOYEE** - EXPERT (Empleado Base)
**Nivel:** Tienda Específica
```
✅ Permitido:
  - Ver Clientes (de su tienda)
  - Crear Clientes (de su tienda)
  - Ver/Crear Órdenes de Servicio (de su tienda)
  - Ver/Crear Citas (de su tienda)

❌ Prohibido:
  - NO puede editar empleados
  - NO puede eliminar nada
  - NO puede ver centros
```

### 3. **EMPLOYEE** - ACCOUNTANT (Contador)
**Nivel:** Reportes Financieros
```
✅ Permitido:
  - Ver Órdenes (READONLY)
  - Ver Ventas (READONLY)
  - Ver Reportes (READONLY)
  - Exportar Reportes

❌ Prohibido:
  - NO puede editar estados
  - NO puede ver información de personal
  - NO puede modificar datos
```

### 4. **EMPLOYEE** - ADMIN_STORE (Admin de Tienda)
**Nivel:** Tienda Completa
```
✅ Permitido:
  - Gestionar Empleados (de su tienda)
  - Gestionar Clientes (de su tienda)
  - Gestionar Órdenes (de su tienda)
  - Gestionar Órdenes de Servicio (de su tienda)
  - Gestionar Ventas (de su tienda)
  - Gestionar Inventario (de su tienda)
  - Ver Citas (de su tienda)

❌ Prohibido:
  - NO puede eliminar empleados
  - NO puede ver datos de otras tiendas
  - NO puede crear nuevas tiendas
```

---

## 📋 CAMBIOS A IMPLEMENTAR

### Cambio 1: Restringir Permisos de USER
```typescript
// ANTES: USER_PERMISSIONS tiene TODOS los permisos
// DESPUÉS: USER_PERMISSIONS solo tiene permisos de su centro

const USER_PERMISSIONS: Permission[] = [
  // Solo gestión de su propio centro
  Permission.VIEW_CENTERS,        // ✅ Ver su centro
  Permission.EDIT_CENTER,         // ✅ Editar su centro
  // NO CREATE_CENTER, DELETE_CENTER

  // Empleados de su centro
  Permission.VIEW_EMPLOYEES,
  Permission.CREATE_EMPLOYEE,
  Permission.EDIT_EMPLOYEE,
  // NO DELETE_EMPLOYEE

  // Tiendas de su centro
  Permission.VIEW_STORES,
  Permission.CREATE_STORE,
  Permission.EDIT_STORE,
  // NO DELETE_STORE

  // Clientes de su centro
  Permission.VIEW_CUSTOMERS,
  Permission.CREATE_CUSTOMER,
  Permission.EDIT_CUSTOMER,
  // NO DELETE_CUSTOMER

  // Órdenes
  Permission.VIEW_ORDERS,
  Permission.CREATE_ORDER,
  Permission.EDIT_ORDER,

  // Órdenes de Servicio
  Permission.VIEW_SERVICE_ORDERS,
  Permission.CREATE_SERVICE_ORDER,
  Permission.EDIT_SERVICE_ORDER,

  // Ventas
  Permission.VIEW_SALES,
  Permission.EDIT_SALE,

  // Inventario
  Permission.VIEW_INVENTORY,
  Permission.EDIT_INVENTORY,

  // Reportes
  Permission.VIEW_REPORTS,
  Permission.EXPORT_REPORTS,

  // Citas
  Permission.VIEW_APPOINTMENTS,
  Permission.CREATE_APPOINTMENT,
  // NO DELETE_APPOINTMENT
];
```

### Cambio 2: Añadir Rol SUPER_ADMIN (para operaciones críticas)
```typescript
export enum UserType {
  SUPER_ADMIN = 'super_admin',  // Nuevo: operaciones críticas
  USER = 'user',                 // Modificado: solo su centro
  EMPLOYEE = 'employee'
}

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  // Todos los permisos (actual USER_PERMISSIONS)
  // Acceso global sin restricciones
];
```

### Cambio 3: Validar CenterId en Servicios
```typescript
// En cada servicio (CentersService, EmployeesService, etc.)
// Añadir validación:

getByCenter(centerId: number) {
  if (!this.authService.hasPermission('VIEW_CENTERS')) {
    throw new UnauthorizedException();
  }
  if (this.authService.userCenterId !== centerId) {
    throw new UnauthorizedException();
  }
  return this.http.get(`/centers/${centerId}`);
}
```

---

## 🔐 VALIDACIONES A AÑADIR

### 1. Guards en Rutas
```typescript
// guard: [centerAdminGuard, permissionGuard('DELETE_EMPLOYEE')]
// No permitir eliminar si no es SUPER_ADMIN o CENTER_ADMIN
```

### 2. Backend (repairhub-api)
```typescript
// En cada endpoint protegido:
- Validar permiso requerido
- Validar centerId/storeId del usuario
- Rechazar si no coincide
```

### 3. Frontend (Guards)
```typescript
// New: hardDeleteGuard (solo SUPER_ADMIN/CENTER_ADMIN)
// Validate: CenterId en cada operación CRUD
```

---

## 📊 IMPACTO

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Riesgo de Seguridad** | 🔴 CRÍTICO | 🟢 BAJO |
| **Aislamiento de Datos** | ❌ No | ✅ Sí |
| **Cumplimiento** | ❌ FALLA | ✅ OK |
| **Complejidad** | Bajo | Medio |
| **Trabajo Estimado** | - | 4-6 horas |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear rol SUPER_ADMIN en backend
- [ ] Restringir USER_PERMISSIONS en frontend
- [ ] Añadir validación de centerId en servicios
- [ ] Añadir hardDeleteGuard
- [ ] Validar en backend cada endpoint
- [ ] Testar con diferentes roles
- [ ] Documentar nuevos roles en README
- [ ] Entrenar al equipo en nueva política de seguridad

---

## 🚀 RECOMENDACIÓN

**Implementar de inmediato:** CRÍTICO para producción
- Sin esta corrección, ANY USER comprometido = acceso total
- Cumplimiento de estándares de seguridad: FALLARÍA

**Urgencia:** ALTA (antes de cualquier deploy)
