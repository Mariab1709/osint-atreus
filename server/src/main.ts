import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://tu-dominio.com']
      : true, // true = acepta cualquier origen en desarrollo
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  
  // Escuchar en todas las interfaces (0.0.0.0) para que funcione en Windows
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  console.log(`🚀 También accesible en http://127.0.0.1:${port}`);
}

bootstrap();