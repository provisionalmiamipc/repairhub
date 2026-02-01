# ✅ SWAGGER CONFIGURADO

## 📚 Acceder a la documentación

Cuando el servidor esté corriendo en desarrollo:

```bash
npm run start:dev
```

Abre en tu navegador:

```
http://localhost:3000/docs
```

---

## ¿Qué se configuró?

✅ **Swagger UI** - Interfaz interactiva en `/docs`
✅ **OpenAPI 3.0** - Especificación estándar
✅ **JWT Authentication** - Ya configurado para autenticación
✅ **Tags** - Endpoints organizados por módulo:
   - Health
   - Auth
   - Users
   - Centers
   - Stores
   - Employees
   - Customers
   - Appointments
   - Devices
   - Items
   - Orders
   - Sales
   - Service Orders
   - Notifications

✅ **Información de proyecto**
   - Título: RepairHub API
   - Versión: 1.0.0
   - Descripción: Sistema de Gestión de Reparaciones y Mantenimiento (RMA)
   - Contacto incluido

✅ **Endpoints documentados**
   - `GET /api` - Verificar API
   - `GET /api/health` - Health check

---

## 🚀 Próximos pasos

### 1. Documentar tus controllers

Agrega decoradores Swagger a tus controllers:

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('items')
@ApiTags('Items')  // ← Agrupa en Swagger
export class ItemsController {
  
  @Get()
  @ApiOperation({ summary: 'Obtener lista de items' })
  @ApiResponse({ status: 200, description: 'Items obtenidos' })
  getAll() {
    // implementación
  }
}
```

### 2. Documentar DTOs

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ example: 'iPhone 13' })
  name: string;

  @ApiProperty({ example: 999.99 })
  price: number;
}
```

### 3. Proteger endpoints con autenticación

```typescript
import { UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')  // ← Mostrará lock en Swagger
@ApiOperation({ summary: 'Crear item (requiere auth)' })
create(@Body() createItemDto: CreateItemDto) {
  // implementación
}
```

---

## 📖 Ver guía completa

Lee el archivo `SWAGGER_GUIDE.md` en esta carpeta para:
- Ejemplos detallados de documentación
- Todos los decoradores disponibles
- Casos de uso comunes
- DTOs bien documentados
- Paginación documentada
- Ejemplos de controllers reales

---

## 🔗 URLs útiles

| URL | Descripción |
|-----|-------------|
| `http://localhost:3000/docs` | Swagger UI (documentación) |
| `http://localhost:3000/api-json` | OpenAPI JSON spec |
| `http://localhost:3000/api` | Endpoint raíz |
| `http://localhost:3000/api/health` | Health check |

---

## ✨ Características de Swagger UI

En la interfaz de Swagger puedes:

✅ **Ver todos los endpoints** agrupados por tag
✅ **Probar endpoints** directamente (Try it out)
✅ **Ver ejemplos de request/response**
✅ **Autorización con JWT** - Pegar token en "Authorize"
✅ **Ver modelos de datos** (Schemas)
✅ **Descargar especificación** en formato OpenAPI

---

## 🔐 Usar JWT en Swagger

1. En Swagger UI, haz clic en el botón **"Authorize"** (arriba a la derecha)
2. Ingresa tu token JWT en el formato:
   ```
   Bearer eyJhbGciOiJIUzI1NiIs...
   ```
3. Haz clic en "Authorize"
4. Ahora todos tus endpoints protegidos funcionarán en Swagger

---

## 🎯 Checklist

- [ ] Servidor corriendo: `npm run start:dev`
- [ ] Swagger accesible: `http://localhost:3000/docs`
- [ ] Documentar controllers (agregar @ApiTags y @ApiOperation)
- [ ] Documentar DTOs (agregar @ApiProperty)
- [ ] Proteger endpoints sensibles (agregar @UseGuards y @ApiBearerAuth)
- [ ] Probar endpoints en Swagger UI
- [ ] Descargar especificación OpenAPI (para frontend)

---

**¡Swagger está listo! 📚**

Ahora documenta tus endpoints para que tu API sea más fácil de usar. 🚀
