# 🚀 CONFIGURACIÓN RÁPIDA PARA PRUEBA LOCAL

## PASO 1: Crear la Base de Datos
```bash
# Abre tu terminal y ejecuta:
psql -U postgres -h localhost

# Dentro de psql, ejecuta:
CREATE DATABASE repairhub;
\c repairhub

# Luego sale con \q
```

## PASO 2: Cargar el Schema
```bash
# Desde /home/alfego/Documentos/repairhub-api:
PGPASSWORD=postgres psql -U postgres -h localhost -d repairhub -f supabase-schema.sql
```

## PASO 3: Crear Usuario Admin (si no se creó)
```bash
psql -U postgres -h localhost -d repairhub

# Dentro de psql:
INSERT INTO "user" (email, "firstName", "lastName", phone, address, gender, role)
VALUES ('admin@localhost', 'Admin', 'System', '123456789', 'localhost', 'Male', 'admin');

\q
```

## PASO 4: Verificar que todo está OK
```bash
psql -U postgres -h localhost -d repairhub

# Dentro de psql:
SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema = 'public';
SELECT email, "firstName", "lastName" FROM "user" LIMIT 5;

\q
```

## PASO 5: Iniciar el Backend
```bash
cd /home/alfego/Documentos/repairhub-api

# Instalar dependencias (si es primera vez)
npm install

# Iniciar servidor
npm run start
# O en modo desarrollo:
npm run start:dev
```

Debería mostrarte algo como:
```
[Nest] 12345  - 01/27/2026, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/27/2026, 10:30:02 AM     LOG [InstanceLoader] ...
[Nest] 12345  - 01/27/2026, 10:30:03 AM     LOG [RoutesResolver] Mapped {/api, POST} route +
RepairHub API running on port 3000 ✅
```

## PASO 6: Probar el Backend
```bash
# En otra terminal:
curl http://localhost:3000/api

# Debería responder algo como:
{"message":"Welcome to RepairHub API"}
```

## PASO 7: Configurar Flutter para Local
Ya está casi listo. Solo verifica que el `http_client.dart` tiene:
```dart
static const String baseUrl = 'http://localhost:3000/api';
```

Luego ejecuta:
```bash
cd /home/alfego/Documentos/Flutter/repairhub
flutter run
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Contraseña de Postgres**: Asume que es `postgres` (localhost, sin password o default)
   - Si es diferente, reemplaza `PGPASSWORD=postgres` con tu contraseña

2. **Puerto Postgres**: Asume puerto 5432 (default)
   - Si es diferente, usa: `-p TU_PUERTO`

3. **El Schema tiene 745 líneas**: Puede tardar 1-2 minutos en cargar

4. **Si hay errores de tablas existentes**: Es normal, SQL intenta crear lo que ya existe. Ignora esos errores.

---

## ✅ CHECKLIST RÁPIDO

- [ ] BD repairhub creada
- [ ] Schema cargado (745 líneas)
- [ ] Usuario admin creado
- [ ] `npm run start` en /repairhub-api
- [ ] API responde en http://localhost:3000/api
- [ ] Flutter apunta a http://localhost:3000/api
- [ ] `flutter run` ejecutándose

Una vez todo esto esté listo, puedes hacer login con:
- **Email**: admin@localhost
- **Password**: (sin configurar - necesita implementación de login)

¿Necesitas ayuda en algún paso?
