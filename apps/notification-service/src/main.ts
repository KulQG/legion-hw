import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);

  const logger = app.get(Logger);
  app.useLogger(logger);

  await app.listen(process.env.NOTIFICATION_SERVICE_PORT ?? 3001);
  logger.log(
    `Server is running on ${process.env.NOTIFICATION_SERVICE_PORT ?? 3001}`,
  );
}

bootstrap().catch((e) => {
  console.error('Error during notification-service bootstrap:', e);
});
