# ============================================================================
# BUILD STAGE - Compilar TypeScript a JavaScript
# ============================================================================
FROM node:18-alpine AS builder

LABEL maintainer="RepairHub <soporte@repairhub.com>"
LABEL description="RepairHub API - Sistema de Gestión de Reparaciones"

WORKDIR /build

# Copiar archivos de definición de dependencias
# Copiar los metadatos primero para poder cachear la instalación de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar todas las dependencias (incluyendo dev) de forma reproducible
# usar `npm ci` para respetar package-lock.json y evitar diferencias entre entornos
RUN npm ci --legacy-peer-deps

# Descargar Chromium en la etapa de build para copiarlo luego a la imagen final
# Esto ayuda cuando el entorno de producción no permite descargas en tiempo de ejecución
RUN npx puppeteer install chrome || npx @puppeteer/browsers install chrome || true

# Copiar todo el contexto restante (asegura que se incluyan plantillas y otros archivos)
COPY . .

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

# Instalar Chromium y dependencias necesarias para Puppeteer en Alpine
# Esto asegura que en PaaS (Railway) Chromium exista en tiempo de ejecución
RUN apk add --no-cache \
            chromium \
            nss \
            freetype \
            harfbuzz \
            ttf-freefont \
            fontconfig && \
        # crear un enlace consistente si el binario existe
        test -f /usr/bin/chromium && ln -sf /usr/bin/chromium /usr/bin/chromium-browser || true

# Indicar a Puppeteer la ruta del ejecutable del sistema
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar la caché de navegadores desde el builder (si existe) y fijar permisos
COPY --from=builder --chown=nestjs:nodejs /root/.cache/puppeteer /home/nestjs/.cache/puppeteer
RUN if [ -d /home/nestjs/.cache/puppeteer ]; then chown -R nestjs:nodejs /home/nestjs/.cache/puppeteer || true; fi

# Copiar código compilado del builder
COPY --from=builder --chown=nestjs:nodejs /build/dist ./dist

# Cambiar al usuario no-root
USER nestjs

# Exponer puerto (Railway asigna dinámicamente)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/src/main.js"]
