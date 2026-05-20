import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config(); // Cargar variables de entorno

const configService = new ConfigService();
const databaseUrl = configService.get<string>('DATABASE_URL');
const sourceRoot = __filename.endsWith('.js') ? 'dist/src' : 'src';

export default new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get('DB_PORT') ?? 5432),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database:
          configService.get<string>('DB_DATABASE') ??
          configService.get<string>('DB_NAME'),
      }),
  // Support both TS (src) when running with ts-node and JS (dist) when running built code
  entities: [`${sourceRoot}/**/*.entity{.ts,.js}`],
  // Keep migrations in src during development and dist when built
  migrations: [`${sourceRoot}/migrations/*{.ts,.js}`],
  synchronize: false,
  logging: true,

  maxQueryExecutionTime: 10000,
});
