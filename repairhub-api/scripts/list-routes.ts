// scripts/list-routes.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RouterModule } from '@nestjs/core';

async function listRoutes() {
  const app = await NestFactory.create(AppModule);
  const server = app.getHttpServer();
  const router = server._events.request._router;

  console.log('🛣️  Available Routes:');
  console.log('=====================');
  
  router.stack.forEach((layer) => {
    if (layer.route) {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      const path = layer.route.path;
      console.log(`${method} ${path}`);
    }
  });

  await app.close();
}

listRoutes();