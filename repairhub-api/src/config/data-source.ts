import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import * as entities from './entities';

config(); // Cargar variables de entorno

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  // Support both TS (src) when running with ts-node and JS (dist) when running built code
  entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity{.ts,.js}'],
  // Keep migrations in src during development and dist when built
  migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,

  maxQueryExecutionTime: 10000,
});