import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  const logger = app.get(Logger);
  app.useLogger(logger);

  const config = new DocumentBuilder()
    .setTitle('Legion')
    .setDescription('The users API')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);

  logger.log(`Server is running on ${process.env.PORT || 3000}`);
}

bootstrap().catch((e) => {
  console.error('Error during application bootstrap:', e);
});
