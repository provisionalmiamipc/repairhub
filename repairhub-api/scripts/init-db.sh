#!/bin/bash
# Script de inicialización para PostgreSQL en Docker
# Se ejecuta automáticamente al crear el contenedor

set -e

echo "================================"
echo "Inicializando RepairHub Database"
echo "================================"

# Las variables de entorno están disponibles aquí
# POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB

# Crear extensiones necesarias
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pg_trgm";
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo ""
echo "================================"
echo "✅ Base de datos inicializada"
echo "================================"
echo ""
echo "Database: $POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo "Port: 5432"
