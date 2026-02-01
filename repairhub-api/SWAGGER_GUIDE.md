# 📚 Swagger configurado en RepairHub API

## Acceso a la Documentación

Cuando el servidor esté corriendo:

```
http://localhost:3000/docs
```

## ¿Qué está configurado?

✅ **Swagger UI** en `/docs`
✅ **OpenAPI 3.0** estándar
✅ **JWT Authentication** predefinido
✅ **Tags organizadas** por módulo
✅ **Información de contacto** incluida

## Cómo documentar tus endpoints

### Ejemplo básico - GET

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('items')
@ApiTags('Items')  // ← Agrupa en la UI
export class ItemsController {
  
  @Get()
  @ApiOperation({ summary: 'Obtener lista de items' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de items obtenida correctamente',
    type: ItemDto,
    isArray: true
  })
  @ApiResponse({ 
    status: 401, 
    description: 'No autorizado' 
  })
  getAll() {
    // implementación
  }
}
```

### Ejemplo POST con body

```typescript
@Post()
@ApiOperation({ summary: 'Crear nuevo item' })
@ApiBody({ type: CreateItemDto })
@ApiResponse({ 
  status: 201, 
  description: 'Item creado',
  type: ItemDto
})
@ApiResponse({ 
  status: 400, 
  description: 'Datos inválidos' 
})
create(@Body() createItemDto: CreateItemDto) {
  // implementación
}
```

### Ejemplo con parámetros

```typescript
@Get(':id')
@ApiOperation({ summary: 'Obtener item por ID' })
@ApiParam({ name: 'id', type: Number, description: 'ID del item' })
@ApiResponse({ 
  status: 200, 
  description: 'Item encontrado',
  type: ItemDto
})
@ApiResponse({ 
  status: 404, 
  description: 'Item no encontrado' 
})
getById(@Param('id') id: number) {
  // implementación
}
```

### Ejemplo con autenticación requerida

```typescript
@Post()
@UseGuards(JwtAuthGuard)  // ← Proteger endpoint
@ApiBearerAuth('JWT-Auth')  // ← Mostrar lock en Swagger
@ApiOperation({ summary: 'Crear item (requiere autenticación)' })
@ApiBody({ type: CreateItemDto })
@ApiResponse({ 
  status: 201, 
  description: 'Item creado',
  type: ItemDto
})
@ApiResponse({ 
  status: 401, 
  description: 'Token inválido o expirado' 
})
create(
  @Body() createItemDto: CreateItemDto,
  @Request() req
) {
  // implementación
}
```

### Ejemplo completo con paginación

```typescript
@Get()
@ApiOperation({ 
  summary: 'Listar items con paginación',
  description: 'Obtiene una lista paginada de items con filtros opcionales'
})
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
@ApiQuery({ name: 'search', required: false, type: String, example: 'iPhone' })
@ApiResponse({ 
  status: 200, 
  description: 'Items obtenidos',
  type: PaginatedItemDto
})
@ApiResponse({ 
  status: 400, 
  description: 'Parámetros inválidos' 
})
getAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string
) {
  // implementación
}
```

## DTOs con decoradores Swagger

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ 
    example: 'iPhone 13',
    description: 'Nombre del item'
  })
  name: string;

  @ApiProperty({ 
    example: 'Device',
    description: 'Tipo de item',
    enum: ['Device', 'Part', 'Service']
  })
  type: string;

  @ApiPropertyOptional({ 
    example: 'Apple smartphone',
    description: 'Descripción del item'
  })
  description?: string;

  @ApiProperty({ 
    example: 999.99,
    description: 'Precio en USD',
    type: Number,
    minimum: 0
  })
  price: number;
}
```

## Tags disponibles

Los siguientes tags ya están definidos en main.ts:

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

Úsalos en tus controllers con `@ApiTags('NombreDelTag')`

## Decoradores más comunes

| Decorador | Uso |
|-----------|-----|
| `@ApiTags()` | Agrupar endpoints en secciones |
| `@ApiOperation()` | Descripción del endpoint |
| `@ApiResponse()` | Documentar respuestas |
| `@ApiParam()` | Documentar parámetros de ruta |
| `@ApiQuery()` | Documentar query parameters |
| `@ApiBody()` | Documentar request body |
| `@ApiProperty()` | Documentar propiedades en DTOs |
| `@ApiPropertyOptional()` | Propiedad opcional en DTOs |
| `@ApiBearerAuth()` | Indicar que requiere JWT |
| `@UseGuards()` | Proteger endpoint con guard |

## Ejemplo real: Users Controller

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete,
  UseGuards 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBody,
  ApiBearerAuth 
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, type: [UserDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

## Verificar que funciona

1. Inicia el servidor:
   ```bash
   npm run start:dev
   ```

2. Abre en el navegador:
   ```
   http://localhost:3000/docs
   ```

3. Deberías ver:
   - ✅ Interfaz Swagger UI
   - ✅ Todos los endpoints listados
   - ✅ Tags organizados
   - ✅ Información de contacto
   - ✅ Opción de probar endpoints

## Exportar OpenAPI JSON

La especificación OpenAPI está disponible en:
```
http://localhost:3000/api-json
```

O descarga en Swagger UI: "Download" button en la parte superior derecha.

## Notas importantes

1. **Decoradores Swagger no afectan funcionalidad**: Solo documentan. Si un endpoint funciona sin @ApiResponse(), Swagger aún lo documentará.

2. **DTOs deben tener decoradores**: Para que Swagger entienda su estructura:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';
   
   export class ItemDto {
     @ApiProperty({ type: Number })
     id: number;

     @ApiProperty()
     name: string;
   }
   ```

3. **Mantén DTOs para inputs y outputs**: Facilita documentación clara.

4. **Usa ejemplos**: `@ApiProperty({ example: 'valor' })` ayuda a usuarios a entender.

---

¡Swagger está listo! 📚 Ahora documenta tus endpoints para que otros desarrolladores (y tú en el futuro) entiendas qué hace cada uno.
