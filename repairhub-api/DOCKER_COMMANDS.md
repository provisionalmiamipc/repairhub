# 🚀 RepairHub API - Comandos Rápidos Docker

## 📚 Índice
- [Iniciar servicios](#iniciar-servicios)
- [Ver logs](#ver-logs)
- [Detener servicios](#detener-servicios)
- [Base de datos](#base-de-datos)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Iniciar servicios

### Inicio rápido (desarrollo)
```bash
docker-compose up -d
```

### Con rebuild de imágenes
```bash
docker-compose up -d --build
```

### En foreground (ver logs en vivo)
```bash
docker-compose up
```

### Verificar estado
```bash
docker-compose ps
```

---

## 📋 Ver logs

### Logs en tiempo real
```bash
docker-compose logs -f
```

### Logs de un servicio específico
```bash
docker-compose logs -f api
docker-compose logs -f postgres
```

### Últimas 100 líneas
```bash
docker-compose logs --tail=100 api
```

### Con timestamps
```bash
docker-compose logs -f -t
```

---

## ⏹️ Detener servicios

### Pausar servicios (mantener datos)
```bash
docker-compose stop
```

### Detener completamente
```bash
docker-compose down
```

### Detener y eliminar volúmenes (CUIDADO: pierde datos)
```bash
docker-compose down -v
```

### Detener un servicio específico
```bash
docker-compose stop api
docker-compose stop postgres
```

---

## 🗄️ Base de datos

### Acceder a PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d repairhub
```

### Dentro de psql
```sql
-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d nombre_tabla

-- Ver usuarios
\du

-- Ver databases
\l

-- Salir
\q
```

### Backup de base de datos
```bash
docker-compose exec postgres pg_dump -U postgres -d repairhub > backup.sql
```

### Restaurar backup
```bash
docker-compose exec -T postgres psql -U postgres -d repairhub < backup.sql
```

### Limpiar base de datos (PELIGROSO)
```bash
docker-compose exec postgres psql -U postgres -d repairhub -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 💻 Desarrollo

### Ejecutar migraciones
```bash
docker-compose exec api npm run migration:run
```

### Generar migración
```bash
docker-compose exec api npm run migration:generate -- -n NombreMigracion
```

### Ver estado de migraciones
```bash
docker-compose exec api npm run migration:show
```

### Ejecutar tests
```bash
docker-compose exec api npm test
```

### Ejecutar tests con cobertura
```bash
docker-compose exec api npm run test:cov
```

### Acceder a bash del contenedor
```bash
docker-compose exec api bash
```

### Instalar nuevas dependencias
```bash
docker-compose exec api npm install nombre-paquete
```

### Rebuild imagen después de cambios en package.json
```bash
docker-compose up -d --build api
```

---

## 🚀 Producción

### Construir imagen de producción
```bash
docker build -t repairhub-api:latest .
```

### Ejecutar contenedor en producción
```bash
docker run -d \
  -p 3000:3000 \
  -e DB_HOST=db.example.com \
  -e DB_PASSWORD=secure_password \
  -e JWT_SECRET=secure_secret_min_64_chars \
  -e NODE_ENV=production \
  --name repairhub-api \
  repairhub-api:latest
```

### Push a registro Docker
```bash
docker tag repairhub-api:latest tu-registro/repairhub-api:latest
docker push tu-registro/repairhub-api:latest
```

---

## 🔧 Troubleshooting

### Rebuild everything
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Verificar health
```bash
curl http://localhost:3000/api/health
```

### Ver uso de recursos
```bash
docker stats
```

### Limpiar imágenes no usadas
```bash
docker image prune -a
```

### Limpiar volúmenes no usados
```bash
docker volume prune
```

### Ver espacio usado por Docker
```bash
docker system df
```

### Limpiar completamente (CUIDADO)
```bash
docker system prune -a --volumes
```

### Reiniciar un servicio
```bash
docker-compose restart api
docker-compose restart postgres
```

### Forzar rebuild y reconstruir
```bash
docker-compose up -d --force-recreate --build
```

---

## 📊 Información útil

### Ver versión de Docker
```bash
docker --version
docker-compose --version
```

### Ver variables de entorno en contenedor
```bash
docker-compose exec api env
```

### Ver red de Docker
```bash
docker network ls
docker inspect repairhub-api_repairhub-network
```

### Copiar archivo del contenedor
```bash
docker-compose cp api:/app/dist ./local-dist
```

### Copiar archivo al contenedor
```bash
docker-compose cp ./file.txt api:/app/file.txt
```

---

## 🎯 Flujo de trabajo típico

### Desarrollo
```bash
# 1. Iniciar servicios
docker-compose up -d

# 2. Ver logs
docker-compose logs -f api

# 3. Hacer cambios en código
# (Se actualizan automáticamente por hot-reload)

# 4. Ejecutar migraciones si cambias esquema
docker-compose exec api npm run migration:run

# 5. Ejecutar tests
docker-compose exec api npm test

# 6. Cuando termines
docker-compose down
```

### Producción
```bash
# 1. Compilar
npm run build

# 2. Crear imagen
docker build -t repairhub-api:v1.0.0 .

# 3. Probar localmente
docker run -p 3000:3000 \
  -e DB_HOST=localhost \
  -e NODE_ENV=production \
  repairhub-api:v1.0.0

# 4. Push a registro
docker tag repairhub-api:v1.0.0 tu-registro/repairhub-api:v1.0.0
docker push tu-registro/repairhub-api:v1.0.0

# 5. Desplegar en servidor
# (usa docker pull y docker run o Kubernetes)
```

---

## 📞 Ayuda rápida

```bash
# Ver ayuda de docker-compose
docker-compose --help

# Ver ayuda de un comando específico
docker-compose logs --help

# Verificar sintaxis de docker-compose.yml
docker-compose config

# Validar que todo está OK
docker-compose ps
curl http://localhost:3000/api/health
curl http://localhost:3000/docs
```

---

¡Listo! Usa estos comandos para gestionar tu entorno Docker. 🚀
