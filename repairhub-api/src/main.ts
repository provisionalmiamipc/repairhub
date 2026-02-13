import './polyfills';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ==================== 🔒 CONFIGURACIÓN CORS ====================
  const nodeEnv = configService.get('NODE_ENV', 'development');
  
  // Orígenes permitidos según el entorno (se puede configurar con CORS_ORIGINS)
  const getCorsOrigins = () => {
    // Leer variable de entorno `CORS_ORIGINS` (coma-separada) vía ConfigService
    const envList = configService.get<string>('CORS_ORIGINS');
    if (envList && envList.trim().length > 0) {
      return envList
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/\/$/, ''));
    }

    if (nodeEnv === 'production') {
      return [
        'https://repairhubcoreui.vercel.app',
        'https://oceanspt.com'
      ];
    } else {
      return [
        'http://localhost:3000',    // Frontend principal
        'http://localhost:4200',    // Angular
      ];
    }
  };

  const corsOptions = {
    origin: (origin: string, callback: Function) => {
      const allowedOrigins = getCorsOrigins();

      // Normalizar origin recibida (quitar slash final si existe)
      const originNormalized = origin ? origin.replace(/\/$/, '') : origin;

      // Permitir requests sin origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Permitir cualquier dominio *.vercel.app en producción
      if (originNormalized && originNormalized.includes('.vercel.app')) {
        return callback(null, true);
      }

      // Permitir orígenes explícitos (comparación con lista normalizada)
      const allowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
      if (allowed.indexOf(originNormalized) !== -1) {
        return callback(null, true);
      }

      // En desarrollo, loggear y permitir; en producción, rechazar
      if (nodeEnv === 'development') {
        logger.warn(`CORS: Origen no configurado pero permitido en desarrollo: ${origin}`);
        return callback(null, true);
      }

      logger.error(`CORS: Origen no permitido en producción: ${origin}`);
      return callback(new Error('No permitido por CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version',
      'X-Platform',
      'Accept-Language',
      'x-employee-role', // Header personalizado para roles de empleados
      'x-employee-id', // Header para identificar empleado
      'x-center-id', // Header para filtrar por centro
      'x-store-id', // Header para filtrar por tienda
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-Response-Time'
    ],
    credentials: true, // 🔐 Importante para cookies/tokens de autenticación
    maxAge: 86400, // ⏰ Cache de preflight por 24 horas
    preflightContinue: false,
    optionsSuccessStatus: 204
  };

  app.enableCors(corsOptions);

  app.setGlobalPrefix('api');

  // Global interceptor to log parsed request body (avoids raw middleware timing issues)
  // This runs inside Nest lifecycle after body parsing so `req.body` is reliable.
  // Using `as any` to avoid extra imports inside this file.
  app.useGlobalInterceptors(({
    intercept: (context: any, next: any) => {
      try {
        const req = context.switchToHttp().getRequest();
        if (req) {
          // Safe stringify
          try { console.log('Incoming body:', JSON.stringify(req.body)); } catch (e) { console.log('Incoming body (raw):', req.body); }
        }
      } catch (e) {
        // ignore
      }
      return next.handle();
    }
  } as any));

  // Middleware: convertir cadenas vacías en `undefined` para evitar validaciones erróneas
  app.use((req, _res, next) => {
    const transformEmptyStrings = (obj: any) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          if (obj[key] === '') {
            obj[key] = undefined;
          } else if (typeof obj[key] === 'object') {
            transformEmptyStrings(obj[key]);
          }
        });
      }
    };
    if (req && req.body) transformEmptyStrings(req.body);
    // DEBUG: log body for validation troubleshooting
    try { console.log('Incoming body:', JSON.stringify(req.body)); } catch (e) {}
    next();
  });

  // ==================== 📚 CONFIGURACIÓN SWAGGER ====================
  const config = new DocumentBuilder()
    .setTitle('RepairHub API')
    .setDescription('Sistema de Gestión de Reparaciones y Mantenimiento (RMA)')
    .setVersion('1.0.0')
    .setContact('Soporte RepairHub', 'https://repairhub.example.com', 'soporte@repairhub.com')
    .setLicense('Proprietary', 'https://repairhub.example.com/license')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Centers', 'Centros de servicio')
    .addTag('Stores', 'Tiendas')
    .addTag('Employees', 'Empleados')
    .addTag('Customers', 'Clientes')
    .addTag('Appointments', 'Citas')
    .addTag('Devices', 'Dispositivos')
    .addTag('Items', 'Artículos / Inventario')
    .addTag('Orders', 'Órdenes de compra')
    .addTag('Sales', 'Ventas')
    .addTag('Service Orders', 'Órdenes de servicio')
    .addTag('Notifications', 'Notificaciones')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-Auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
      filter: true,
      showRequestHeaders: true,
      docExpansion: 'list',
    },
    customCss: `
      .topbar { display: none; }
      .swagger-ui .topbar { display: none; }
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      .scheme-container { background: #fafafa; padding: 20px; border-radius: 4px; }
    `,
    customSiteTitle: 'RepairHub API Docs',
  });

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no decoradas
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma los datos a los tipos especificados
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  // Intentamos enlazar únicamente al puerto configurado. Si está ocupado,
  // salimos con código de error para evitar comportamiento inesperado.
  try {
    await app.listen(port, host);
  } catch (err: any) {
    if (err && err.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Exiting.`);
      process.exit(1);
    }
    throw err;
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   RepairHub API - INICIADO                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🌐 API:          http://${host}:${port}/api                      ║
║  📚 Swagger Docs: http://${host}:${port}/docs                     ║
║  🏥 Health:       http://${host}:${port}/api/health               ║
║                                                                ║
║  Env: ${nodeEnv}                                                    ║
║  Port: ${port}                                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
}
bootstrap();

// Graceful shutdown / diagnostic handlers so we can see why the process is terminated
process.on('SIGTERM', async () => {
  try {
    console.log('SIGTERM received - graceful shutdown start');
    // attempt to close Nest app if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const appModule = require('./dist/src/main');
  } catch (e) {
    // ignore
  }
  // give some time for logs to flush
  setTimeout(() => {
    console.log('SIGTERM - exiting process');
    process.exit(0);
  }, 500);
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // Treat unhandled rejections as fatal so the process doesn't stay in a bad state
  setTimeout(() => process.exit(1), 200);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // allow the process manager to restart after logging
  setTimeout(() => process.exit(1), 200);
});
