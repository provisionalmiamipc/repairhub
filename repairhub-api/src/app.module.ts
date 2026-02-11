import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { UploadsModule } from './uploads/uploads.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CentersModule } from './centers/centers.module';
import { CustomersModule } from './customers/customers.module';
import { DevicesModule } from './devices/devices.module';
import { EmployeesModule } from './employees/employees.module';
import { InventoryMovementsModule } from './inventory_movements/inventory_movements.module';
import { ItemModule } from './item/item.module';
import { ItemTypesModule } from './item_types/item_types.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { OrdersItemModule } from './orders_item/orders_item.module';
import { PaymentTypeModule } from './payment_type/payment_type.module';
import { RepairStatusModule } from './repair_status/repair_status.module';
import { SODiagnosticModule } from './s_o_diagnostic/s_o_diagnostic.module';
import { SOItemsModule } from './s_o_items/s_o_items.module';
import { SONotesModule } from './s_o_notes/s_o_notes.module';
import { SaleItemsModule } from './sale_items/sale_items.module';
import { SalesModule } from './sales/sales.module';
import { ServiceOrdersModule } from './service_orders/service_orders.module';
import { ServiceOrdersRequestedModule } from './service_orders_requested/service_orders_requested.module';
import { ServiceTypeModule } from './service_type/service_type.module';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './user/user.module';
import { DeviceBrandsModule } from './device_brands/device_brands.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const candidate1 = join(__dirname, '..', 'templates', 'emails');
        const candidate2 = join(__dirname, '..', 'src', 'templates', 'emails');
        let templatesDir = candidate1;
        if (!existsSync(candidate1) && existsSync(candidate2)) {
          templatesDir = candidate2;
        }
        if (!existsSync(templatesDir)) {
          console.warn(`Mailer templates folder not found. Checked: ${candidate1} and ${candidate2}`);
        }

        const fromName = configService.get<string>('FROM_NAME');
        const fromEmail = configService.get<string>('FROM_EMAIL') || `no-reply@${configService.get<string>('SMTP_HOST') || 'repairhub'}`;
        const defaultFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        return {
          transport: {
            host: configService.get<string>('SMTP_HOST'),
            port: Number(configService.get<number>('SMTP_PORT') ?? 587),
            secure: configService.get('SMTP_SECURE') === 'true',
            auth: {
              user: configService.get<string>('SMTP_USER'),
              pass: configService.get<string>('SMTP_PASS'),
            },
          },
          defaults: {
            from: defaultFrom,
          },
          template: {
            dir: templatesDir,
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const baseOptions: TypeOrmModuleOptions = {
          type: 'postgres',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
          logging: configService.get('DB_LOGGING') === 'true',
          autoLoadEntities: true, // ← Importante para cargar entidades automáticamente
        };

        if (databaseUrl) {
          return {
            ...baseOptions,
            url: databaseUrl,
          };
        }

        return {
          ...baseOptions,
          host: configService.get<string>('DB_HOST'),
          port: Number(configService.get('DB_PORT') ?? 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database:
            configService.get<string>('DB_DATABASE') ??
            configService.get<string>('DB_NAME'),
        };
      },
      inject: [ConfigService],
      
    }),
    AuthModule,
    UsersModule, 
    CentersModule, 
    StoresModule, 
    ServiceOrdersModule, 
    OrdersModule, 
    EmployeesModule, 
    CustomersModule, 
    AppointmentsModule, 
    DevicesModule,DeviceBrandsModule,
    ItemModule, 
    ItemTypesModule, 
    // Uploads
    UploadsModule,
    OrdersItemModule, 
    SalesModule, 
    SaleItemsModule, ServiceOrdersRequestedModule, RepairStatusModule, SONotesModule, SODiagnosticModule, SOItemsModule, ServiceTypeModule, PaymentTypeModule, InventoryMovementsModule, NotificationsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit{
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    // Crear usuario admin al iniciar la app
    await this.createAdminUser();
  }

  private async createAdminUser() {
    // El mismo código del script anterior aquí
    const dataSource = new DataSource(
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [User],
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE ?? process.env.DB_NAME,
            entities: [User],
          },
    );
    
      await dataSource.initialize();
    
      const userRepository = dataSource.getRepository(User);
    
      // Verificar si ya existe el admin
      const existingAdmin = await userRepository.findOne({
        where: { email: 'admin@system.com' }
      });
    
      if (!existingAdmin) {
        // Hash la contraseña antes de crear
        const hashedPassword = await bcrypt.hash('AdminMasterPass.00', 12);
        
        const adminUser = userRepository.create({
          email: 'admin@system.com',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          isActive: true,
        });
    
        await userRepository.save(adminUser);
        console.log('✅ Admin user created: admin@system.com');
        
      } else {
        console.log('ℹ️ Admin user already exists');
      }
    
      await dataSource.destroy();
  }
}
