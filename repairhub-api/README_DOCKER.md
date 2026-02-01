# RepairHub API - Sistema de Gestión de Reparaciones

[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red?style=flat-square&logo=nestjs)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-inactive?style=flat-square)](LICENSE)

API REST para sistema de gestión de reparaciones (RMA) con autenticación JWT, multiroles, y documentación automática con Swagger.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Documentación API](#documentación-api)
- [Base de Datos](#base-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Testing](#testing)
- [Contribución](#contribución)
- [Soporte](#soporte)

---

## ✨ Características

### 🔐 Autenticación y Autorización
- ✅ JWT con roles diferenciados (Usuario Admin, Empleados)
- ✅ Tokens con expiración configurable
- ✅ Refresh tokens para renovación
- ✅ Autenticación con Passport.js
- ✅ Bcrypt para hasheo de contraseñas (12 rounds)

### 📊 Módulos de Negocio (18 entidades)
- **Usuarios**: Gestión de usuarios administrativos
- **Empleados**: Personal con roles y permisos
- **Centros**: Centros de servicio
- **Tiendas**: Puntos de venta
- **Clientes**: Gestión de clientes
- **Dispositivos**: Equipos reparables
- **Órdenes**: Órdenes de compra
- **Ventas**: Gestión de ventas
- **Órdenes de Servicio**: RMA completo
- **Citas**: Programación de citas
- **Inventario**: Gestión de artículos
- **Notificaciones**: Sistema de alertas
- Y más...

### 📚 Documentación Automática
- ✅ Swagger UI en `/docs`
- ✅ OpenAPI 3.0 spec en `/api-json`
- ✅ Documentación de cada endpoint
- ✅ Esquemas de request/response
- ✅ Ejemplos de uso
- ✅ Pruebas interactivas

### 🔧 Desarrollo
- ✅ TypeORM con PostgreSQL
- ✅ Migrations automáticas
- ✅ Validación con class-validator
- ✅ Transformación con class-transformer
- ✅ Configuración por entorno
- ✅ Logging estructurado
- ✅ CORS configurable
- ✅ Compresión de respuestas

### 🚀 DevOps Ready
- ✅ Dockerfile multi-etapa
- ✅ Docker Compose incluido
- ✅ Healthchecks
- ✅ Variables de entorno
- ✅ Listo para Kubernetes

---

## 📦 Requisitos Previos

### Instalación Local
- **Node.js**: v18.0.0 o superior
- **npm**: v9.0.0 o superior
- **PostgreSQL**: v12 o superior
- **Linux/macOS/WSL2** (Windows)

### Con Docker
- **Docker**: v20.10 o superior
- **Docker Compose**: v1.29 o superior

### Verificar instalación
```bash
node --version          # v18.x.x
npm --version           # v9.x.x
docker --version        # Docker version 20.10.x
docker-compose --version # Docker Compose version 1.29.x
```

---

## 🚀 Instalación

### Opción 1: Instalación Local

#### 1.1 Clonar el repositorio
```bash
git clone https://github.com/tuusuario/repairhub-api.git
cd repairhub-api
```

#### 1.2 Instalar dependencias
```bash
npm install
```

#### 1.3 Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env con tus valores
nano .env
```

#### 1.4 Crear base de datos
```bash
# Asegúrate que PostgreSQL está corriendo
psql -U postgres -h localhost

# Dentro de psql:
CREATE DATABASE repairhub;
\c repairhub

# Cargar schema SQL
\i supabase-schema.sql
\q
```

#### 1.5 Ejecutar migraciones (si es necesario)
```bash
npm run migration:run
```

#### 1.6 Iniciar servidor
```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### Opción 2: Instalación con Docker (Recomendado)

#### 2.1 Clonar el repositorio
```bash
git clone https://github.com/tuusuario/repairhub-api.git
cd repairhub-api
```

#### 2.2 Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env si es necesario
nano .env
```

#### 2.3 Construir e iniciar con Docker Compose
```bash
# Construir imágenes
docker-compose build

# Iniciar servicios (API + PostgreSQL)
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f api

# Verificar estado
docker-compose ps
```

#### 2.4 Verificar que funciona
```bash
# API disponible
curl http://localhost:3000/api

# Swagger disponible
curl http://localhost:3000/docs

# Health check
curl http://localhost:3000/api/health
```

#### 2.5 Detener servicios
```bash
docker-compose down
```

---

## ⚙️ Configuración

### Estructura de carpetas
```
repairhub-api/
├── src/
│   ├── config/              # Configuración (base de datos, etc)
│   ├── common/              # Utilidades comunes
│   ├── auth/                # Autenticación y JWT
│   ├── users/               # Módulo de usuarios
│   ├── employees/           # Módulo de empleados
│   ├── centers/             # Módulo de centros
│   ├── stores/              # Módulo de tiendas
│   ├── customers/           # Módulo de clientes
│   ├── devices/             # Módulo de dispositivos
│   ├── items/               # Módulo de artículos
│   ├── orders/              # Módulo de órdenes
│   ├── sales/               # Módulo de ventas
│   ├── service_orders/      # Módulo de órdenes de servicio (RMA)
│   ├── appointments/        # Módulo de citas
│   ├── notifications/       # Módulo de notificaciones
│   ├── migrations/          # Migraciones de base de datos
│   ├── main.ts              # Punto de entrada
│   └── app.module.ts        # Módulo raíz
├── test/                    # Tests E2E
├── dist/                    # Código compilado
├── .env                     # Variables de entorno
├── .env.example             # Plantilla de variables
├── docker-compose.yml       # Configuración Docker Compose
├── Dockerfile               # Imagen Docker
├── package.json
└── tsconfig.json
```

### Archivos de configuración importantes
```bash
# Variables de entorno
.env                        # Tu configuración privada
.env.example               # Plantilla (versión pública)

# Docker
docker-compose.yml         # Servicios (API + PostgreSQL)
Dockerfile                # Imagen de la API

# Base de datos
src/config/data-source.ts  # Configuración TypeORM
src/migrations/            # Migraciones SQL
```

---

## 🏃 Ejecución

### Desarrollo Local

```bash
# Terminal 1: Base de datos (si no usas Docker)
# Asegúrate que PostgreSQL está corriendo
psql -U postgres -h localhost

# Terminal 2: Servidor en watch mode
npm run start:dev

# Terminal 3: Pruebas (opcional)
npm test -- --watch
```

### Con Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Ejecutar comando dentro del contenedor
docker-compose exec api npm run migration:run

# Detener servicios
docker-compose down

# Detener y eliminar datos
docker-compose down -v
```

### Comandos útiles

```bash
# Desarrollo
npm run start:dev          # Watch mode con hot-reload
npm run start:debug        # Debug mode

# Producción
npm run build              # Compilar TypeScript
npm run start:prod         # Ejecutar en producción

# Base de datos
npm run migration:generate # Generar migración
npm run migration:run      # Ejecutar migraciones
npm run migration:revert   # Revertir última migración
npm run migration:show     # Ver migraciones

# Calidad de código
npm run lint               # ESLint
npm run format             # Prettier
npm test                   # Jest
npm run test:cov           # Cobertura

# Docker
docker-compose up          # Iniciar (en foreground)
docker-compose up -d       # Iniciar (en background)
docker-compose down        # Detener
docker-compose logs -f     # Ver logs en tiempo real
docker-compose ps          # Ver estado de servicios
```

---

## 📚 Documentación API

### Acceso a Swagger UI
```
http://localhost:3000/docs
```

Aquí puedes:
- ✅ Ver todos los endpoints documentados
- ✅ Probar endpoints interactivamente ("Try it out")
- ✅ Autorizar con JWT (botón "Authorize")
- ✅ Ver esquemas de request/response
- ✅ Descargar especificación OpenAPI

### Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api` | Verificar que API está operativa |
| GET | `/api/health` | Health check con información de servidor |
| GET | `/docs` | Documentación Swagger UI |
| GET | `/api-json` | Especificación OpenAPI JSON |

### Autenticación

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@localhost",
  "password": "tu_contraseña"
}

# Respuesta:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 604800
}
```

#### Usar token en requests
```bash
# En Swagger UI:
1. Click en "Authorize" (arriba a la derecha)
2. Pegar: Bearer eyJhbGciOiJIUzI1NiIs...
3. Click en "Authorize"

# Con curl:
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:3000/api/users
```

#### Refresh token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 🗄️ Base de Datos

### Inicialización automática (Docker)
Docker Compose se encarga de:
1. Crear contenedor PostgreSQL
2. Crear database `repairhub`
3. Cargar schema automáticamente (si existe SQL en `docker-entrypoint-initdb.d/`)

### Inicialización manual (Local)
```bash
# 1. Conectar a PostgreSQL
psql -U postgres -h localhost

# 2. Crear database
CREATE DATABASE repairhub;
\c repairhub

# 3. Cargar schema
\i supabase-schema.sql

# 4. Verificar tablas
\dt

# 5. Salir
\q
```

### Migraciones con TypeORM

```bash
# Generar migración automática
npm run migration:generate -- -n NombreMigracion

# Crear migración manual
npm run migration:create -- -n NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

### Conectarse a la BD desde Docker
```bash
# Acceder a psql dentro del contenedor
docker-compose exec postgres psql -U postgres -d repairhub

# Ver tablas
\dt

# Ver estructura de tabla
\d nombre_tabla

# Salir
\q
```

---

## 🔐 Variables de Entorno

### Archivo `.env` de ejemplo

```bash
# ==================== DATABASE ====================
DB_HOST=postgres              # Hostname (localhost si es local, postgres si es Docker)
DB_PORT=5432                  # Puerto PostgreSQL
DB_USERNAME=postgres          # Usuario PostgreSQL
DB_PASSWORD=postgres          # Contraseña PostgreSQL
DB_DATABASE=repairhub         # Nombre de la database
DB_SYNCHRONIZE=false          # No sincronizar automáticamente
DB_LOGGING=true               # Log de queries SQL

# ==================== APPLICATION ====================
PORT=3000                     # Puerto de la API
NODE_ENV=development          # environment: development | staging | production

# ==================== JWT AUTHENTICATION ====================
# Usuario Admin (Master)
JWT_SECRET=tu_secret_muy_largo_aqui_minimo_64_caracteres
JWT_EXPIRES_IN=7d

# Empleados (Acceso limitado)
JWT_EMPLOYEE_SECRET=otro_secret_largo_aqui_minimo_64_caracteres
JWT_EMPLOYEE_EXPIRES_IN=1d

# ==================== SECURITY ====================
BCRYPT_ROUNDS=12              # Iteraciones bcrypt (mayor = más seguro pero más lento)

# ==================== CORS ====================
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD
CORS_ALLOWED_HEADERS=Content-Type,Authorization,Accept,X-Requested-With,X-API-Key
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400

# ==================== EMAIL (OPCIONAL) ====================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
EMAIL_FROM=noreply@repairhub.com
```

### Variables requeridas
- ✅ `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- ✅ `JWT_SECRET`, `JWT_EMPLOYEE_SECRET`
- ✅ `PORT`, `NODE_ENV`

### Generar secretos JWT seguros
```bash
# Linux/macOS
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## 📦 Docker Compose

### Archivo: `docker-compose.yml`
```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: repairhub-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: repairhub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d repairhub"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - repairhub-network

  # NestJS API
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: repairhub-api
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      DB_DATABASE: repairhub
      PORT: 3000
      NODE_ENV: development
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run start:dev
    networks:
      - repairhub-network

networks:
  repairhub-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### Opciones útiles de docker-compose
```bash
# Iniciar en background
docker-compose up -d

# Iniciar en foreground (ver logs)
docker-compose up

# Reconstruir imágenes
docker-compose up --build

# Detener servicios sin eliminar datos
docker-compose stop

# Detener y eliminar servicios
docker-compose down

# Eliminar datos también
docker-compose down -v

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f postgres

# Ver estado de servicios
docker-compose ps

# Ejecutar comando en contenedor
docker-compose exec api npm run migration:run

# Acceder a shell del contenedor
docker-compose exec api bash
docker-compose exec postgres psql -U postgres -d repairhub
```

---

## 📝 Structure del Proyecto

### Módulos principales
Cada módulo sigue la estructura:
```
modulo/
├── modulo.controller.ts        # Endpoints (rutas)
├── modulo.controller.spec.ts   # Tests del controller
├── modulo.service.ts           # Lógica de negocio
├── modulo.service.spec.ts      # Tests del service
├── modulo.module.ts            # Definición del módulo
├── dto/                        # Data Transfer Objects
│   ├── create-modulo.dto.ts
│   ├── update-modulo.dto.ts
│   └── modulo.dto.ts
└── entities/                   # Entidades TypeORM
    └── modulo.entity.ts
```

### Ejemplo: Users Module
```
users/
├── users.controller.ts         # GET /users, POST /users, etc
├── users.controller.spec.ts
├── users.service.ts            # Lógica de usuarios
├── users.service.spec.ts
├── users.module.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user.dto.ts
└── entities/
    └── user.entity.ts
```

---

## ✅ Testing

### Ejecutar tests
```bash
# Tests unitarios
npm test

# Con watch mode
npm test -- --watch

# Con cobertura
npm run test:cov

# Tests E2E
npm run test:e2e

# Debug
npm run test:debug
```

### Estructura de tests
```
src/
├── modulo/
│   ├── modulo.service.spec.ts      # Tests unitarios
│   └── modulo.controller.spec.ts   # Tests del controller

test/
└── app.e2e-spec.ts                 # Tests E2E
```

---

## 🔍 Troubleshooting

### Puerto 3000 ya está en uso
```bash
# Encontrar proceso
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O usar otro puerto
PORT=3001 npm run start:dev
```

### Errores de conexión a base de datos
```bash
# Verificar que PostgreSQL está corriendo
pg_isready -h localhost

# Verificar credenciales en .env
# Asegúrate que coinciden con las de PostgreSQL
```

### Error: EADDRINUSE en Docker
```bash
# Limpiar servicios
docker-compose down -v

# Reconstruir
docker-compose up --build
```

### Migraciones no se ejecutan
```bash
# Ejecutarlas manualmente
docker-compose exec api npm run migration:run

# Ver estado
docker-compose exec api npm run migration:show
```

### Logs y debugging
```bash
# Ver logs en tiempo real
docker-compose logs -f api

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Aumentar verbosidad
NODE_ENV=development npm run start:dev

# Debug mode
npm run start:debug
```

---

## 📊 Monitoreo

### Health Check
```bash
curl http://localhost:3000/api/health

# Respuesta:
{
  "status": "ok",
  "timestamp": "2026-01-27T14:30:00.000Z",
  "uptime": 3600.5
}
```

### Logs estructurados
La API genera logs para:
- Arranque del servidor
- Conexión a base de datos
- Migraciones ejecutadas
- Autenticación/Autorización
- Errores de validación
- Queries SQL (si DB_LOGGING=true)

---

## 🚀 Despliegue a Producción

### Compilar para producción
```bash
npm run build
npm run start:prod
```

### En Docker
```bash
# Construir imagen de producción
docker build -t repairhub-api:latest .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e DB_HOST=postgres.example.com \
  -e DB_PASSWORD=contraseña_segura \
  -e JWT_SECRET=tu_secret_seguro \
  repairhub-api:latest
```

### Checklist de producción
- [ ] Generar secrets seguros para JWT
- [ ] Configurar base de datos remota
- [ ] Habilitar HTTPS en CORS
- [ ] Deshabilitar Swagger en producción (opcional)
- [ ] Configurar variables de entorno seguras
- [ ] Configurar backups de base de datos
- [ ] Implementar monitoring y alertas
- [ ] Configurar CI/CD pipeline
- [ ] Usar reverse proxy (nginx/Apache)
- [ ] Implementar rate limiting

---

## 📞 Soporte

### Documentación adicional
- 📄 [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - Cómo documentar endpoints
- 📄 [SWAGGER_QUICK_START.md](./SWAGGER_QUICK_START.md) - Referencia rápida
- 📄 [SWAGGER_SETUP_COMPLETE.md](./SWAGGER_SETUP_COMPLETE.md) - Setup detallado
- 📄 [SETUP_LOCAL.md](./SETUP_LOCAL.md) - Configuración local
- 📄 [PRUEBA_LOCAL.md](./PRUEBA_LOCAL.md) - Guía de pruebas

### Reportar issues
1. Descripción clara del problema
2. Pasos para reproducir
3. Logs relevantes
4. Información del entorno (OS, Node version, etc)
5. Variables de entorno (sin secretos)

### Contacto
- Email: soporte@repairhub.com
- Issues: https://github.com/tuusuario/repairhub-api/issues
- Docs: https://repairhub.example.com/api/docs

---

## 📄 Licencia

Proprietary - RepairHub © 2026. Todos los derechos reservados.

---

## 👥 Contribuidores

- **Nombre**: Descripción
- **Mantenedor**: Tu nombre

---

## 📋 Checklist de Configuración Inicial

- [ ] Clonar repositorio
- [ ] Instalar dependencias (`npm install`)
- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar variables de entorno
- [ ] Iniciar PostgreSQL (local o Docker)
- [ ] Crear database
- [ ] Ejecutar migraciones
- [ ] Iniciar servidor (`npm run start:dev`)
- [ ] Acceder a Swagger (`http://localhost:3000/docs`)
- [ ] Crear usuario admin
- [ ] Probar endpoints

---

**¡Bienvenido a RepairHub API! 🚀**

Para preguntas, consulta la documentación Swagger en `/docs` cuando el servidor esté corriendo.
