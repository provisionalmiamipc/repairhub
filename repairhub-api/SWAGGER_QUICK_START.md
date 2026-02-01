# 🎯 ACCESO RÁPIDO A SWAGGER

## 🌐 URL

```
http://localhost:3000/docs
```

**Abre esto en tu navegador cuando el servidor esté corriendo.**

---

## ⚡ Comandos rápidos

```bash
# Terminal 1: Iniciar servidor
cd /home/alfego/Documentos/repairhub-api
npm run start:dev

# Espera a ver: "RepairHub API running on port 3000 ✅"

# Terminal 2: Ir a http://localhost:3000/docs en el navegador
```

---

## 📚 Qué ves en Swagger

```
┌─────────────────────────────────────────────────────┐
│  RepairHub API                          [Authorize] │
│  v1.0.0 | Servers                                   │
│                                                      │
│  Health                                             │
│  ├─ GET /                                           │
│  └─ GET /health                                     │
│                                                      │
│  Auth                                               │
│  ├─ POST /auth/login                                │
│  ├─ POST /auth/logout                               │
│  └─ POST /auth/refresh                              │
│                                                      │
│  Users, Centers, Items, Orders... (más modules)    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Probar endpoints protegidos

1. **Click en "Authorize"** (arriba a la derecha)
2. **Pegar token JWT** en este formato:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Click en "Authorize"**
4. Ya puedes probar endpoints que requieren autenticación

---

## 📥 Descargar OpenAPI

En Swagger UI hay un botón "Download" para descargar:
- `openapi.json` - Especificación completa
- Úsalo para generar SDKs en otros lenguajes
- Útil para integrar con frontend

---

## 🛠️ Archivos de referencia

- **SWAGGER_GUIDE.md** - Ejemplos de cómo documentar endpoints
- **SWAGGER_SETUP_COMPLETE.md** - Instrucciones detalladas
- **main.ts** - Configuración de Swagger

---

## ✅ Verificar

```bash
# Probar que está respondiendo
curl http://localhost:3000/api
# Debería responder: {"message":"Welcome to RepairHub API"}

curl http://localhost:3000/api/health
# Debería responder: {"status":"ok","timestamp":"2026-01-27T...","uptime":...}
```

---

**¡Listo!** Tu API está documentada y lista para usar. 🚀
