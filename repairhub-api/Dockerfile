# ============================================================================
# BUILD STAGE - Compilar TypeScript a JavaScript
# ============================================================================
FROM node:18-alpine AS builder

LABEL maintainer="RepairHub <soporte@repairhub.com>"
LABEL description="RepairHub API - Sistema de Gestión de Reparaciones"

WORKDIR /build

# Copiar archivos de definición de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas las dependencias (incluyendo dev)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY src ./src

# Compilar TypeScript a JavaScript
RUN npm run build

# ============================================================================
# PRODUCTION STAGE - Imagen pequeña solo con lo necesario
# ============================================================================
FROM node:18-alpine

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copiar archivos de dependencias
COPY --from=builder --chown=nestjs:nodejs /build/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copiar código compilado del builder
COPY --from=builder --chown=nestjs:nodejs /build/dist ./dist

# Cambiar al usuario no-root
USER nestjs

# Exponer puerto (Railway asigna dinámicamente)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/src/main.js"]
