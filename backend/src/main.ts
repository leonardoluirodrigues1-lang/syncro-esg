import './carregar-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function iniciar() {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    throw new Error('Defina as variáveis DATABASE_URL e JWT_SECRET.');
  }

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  // whitelist descarta campos que não estão no DTO; transform converte a query string em número
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
void iniciar();
