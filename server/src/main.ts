import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 3001;

  // Habilitar prefijo global /api para que coincida con las llamadas del frontend
  app.setGlobalPrefix('api');

  // Configurar CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  });

  await app.listen(PORT);
  logger.log(`🚀 Servidor OSINT Astraeus (NestJS) corriendo en http://localhost:${PORT}`);
}

bootstrap();
