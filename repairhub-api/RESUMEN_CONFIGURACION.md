# 📋 Resumen de Configuración - Sistema RMA con Supabase

## ✅ Estado Actual

- ✅ Esquema de base de datos completo (`supabase-schema.sql`)
- ✅ Políticas RLS configuradas (`supabase-rls-policies.sql`)
- ✅ Distinción automática entre `user` (master) y `employee`
- ✅ Matriz de permisos mantenida (User tiene acceso completo)

## 🎯 Configuración Requerida

### 1. Usuario Master del Sistema

**No hay usuarios en la base de datos actualmente**. Necesitas crear el usuario master:

**📖 Guía Completa**: `INICIALIZACION_USUARIO_MASTER.md`

**Método Rápido**:
```bash
# Configurar variables en .env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Ejecutar script
npx ts-node create-master-user-admin-api.ts
```

**Credenciales por defecto**:
- Email: `admin@system.com`
- Password: `AdminMasterPass.00`
- Tipo: `user` (Administrador del Sistema)

### 2. Distinción User vs Employee

Supabase distingue automáticamente mediante `user_metadata.type`:

| Tipo | Metadata | Acceso |
|------|----------|--------|
| **User** | `{"type": "user", "user_id": 1}` | ✅ **Completo** (todas las tablas) |
| **Employee** | `{"type": "employee", "employee_id": 1, ...}` | ⚠️ Limitado (por centro/tienda) |

Las políticas RLS verifican automáticamente:
- `is_system_admin()` → Retorna `TRUE` solo si `type = 'user'`
- Todas las políticas incluyen: `is_system_admin() OR ...`

## 📊 Matriz de Permisos (Mantenida)

| Rol | Acceso |
|-----|--------|
| **User** | ✅ **TODO** (sin restricciones) |
| CenterAdmin | Su centro completo |
| AdminStore | Su tienda completa |
| Accountant | Datos financieros de su centro |
| Employee | Datos de su centro/tienda (limitado) |

## 🚀 Orden de Ejecución

1. **Ejecutar esquema base**:
   ```sql
   \i supabase-schema.sql
   ```

2. **Crear usuario master**:
   ```bash
   npx ts-node create-master-user-admin-api.ts
   ```

3. **Ejecutar políticas RLS**:
   ```sql
   \i supabase-rls-policies.sql
   ```

4. **Verificar**:
   ```sql
   \i validate-schema.sql
   ```

## 📚 Documentación

- **`INICIALIZACION_USUARIO_MASTER.md`** - Crear usuario master
- **`RLS_SETUP_GUIDE.md`** - Configuración completa de RLS
- **`SUPABASE_AUTH_COMPLETA.md`** - Migración a Supabase Auth
- **`FLUTTER_SUPABASE_AUTH_EXAMPLE.md`** - Ejemplos Flutter

## 🔍 Verificación Rápida

### Verificar Usuario Master

```sql
-- En tabla user
SELECT * FROM "user" WHERE email = 'admin@system.com';

-- En Supabase Auth
SELECT 
    email,
    raw_user_meta_data->>'type' AS tipo,
    raw_user_meta_data->>'user_id' AS user_id
FROM auth.users
WHERE email = 'admin@system.com';
```

### Probar Login desde Flutter

```dart
final response = await supabase.auth.signInWithPassword(
  email: 'admin@system.com',
  password: 'AdminMasterPass.00',
);

print('Tipo: ${response.user?.userMetadata?['type']}'); // Debe ser "user"
print('User ID: ${response.user?.userMetadata?['user_id']}'); // Debe ser 1
```

### Verificar Acceso Completo

Con el usuario master autenticado, deberías poder:
- ✅ Ver todas las tablas
- ✅ Crear/Actualizar/Eliminar cualquier registro
- ✅ Sin restricciones de centro/tienda

## ⚠️ Importante

1. **Cambiar password** después del primer login
2. **No usar** el usuario master para operaciones diarias
3. **Crear empleados** específicos para cada centro/tienda
4. **Verificar metadata** en cada login

---

**Última actualización**: 2026-01-26
