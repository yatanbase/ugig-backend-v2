import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GameGateway } from './game.gateway'; // Adjust the path as necessary
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const gameGatewayInstances = app.get(GameGateway);
  console.log('GameGateway Instances:', gameGatewayInstances); // Inspect in console
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
