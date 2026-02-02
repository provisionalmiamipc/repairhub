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
  
  // Orígenes permitidos según el entorno
  const getCorsOrigins = () => {
    if (nodeEnv === 'production') {
      return [
        'https://repairhubcoreui.vercel.app',
        'https://repairhubcoreui-c46up6hld-alejandros-projects-ca53de42.vercel.app',
        'https://repairhub-2iimhaw0k-alejandros-projects-ca53de42.vercel.app'
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
      
      // ✅ Permitir requests sin origen (mobile apps, curl, postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // ✅ Permitir orígenes explícitos
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // ⚠️ En desarrollo, loggear el origen bloqueado pero permitirlo
        if (nodeEnv === 'development') {
          logger.warn(`CORS: Origen no configurado pero permitido en desarrollo: ${origin}`);
          callback(null, true);
        } else {
          // 🚫 En producción, rechazar orígenes no permitidos
          logger.error(`CORS: Origen no permitido en producción: ${origin}`);
          callback(new Error('No permitido por CORS'), false);
        }
      }
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
  
  await app.listen(port, host);
  
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
