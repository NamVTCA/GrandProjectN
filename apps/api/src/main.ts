import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cho phép truy cập file tĩnh (ảnh, video)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  // Bật CORS
  app.enableCors();

  // Tiền tố API
  app.setGlobalPrefix('api');

  // Bật validation toàn cục
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(8888);
}
bootstrap();
