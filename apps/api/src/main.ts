// File: apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { CustomLogger } from './custom-logger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new CustomLogger(),
  });

  // Cho phép truy cập file tĩnh (ảnh, video)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // CORS: chỉ cho phép front-end và bật credentials
  app.enableCors({
    origin: 'http://localhost:5173',  // URL dev server Vite
    credentials: true,
  });

  // Tiền tố API
  app.setGlobalPrefix('api');

  // Bật validation toàn cục
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(8888);
}
bootstrap();
