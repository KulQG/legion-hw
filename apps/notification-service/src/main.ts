import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module';
import { Logger } from 'nestjs-pino';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigType } from '@nestjs/config';
import appConfig from '../config/app.config';
import { KafkaConfigType } from '../../../lib/common/types';
import kafkaConfig from '../../../lib/common/configs/kafka.config';
import { HttpExceptionFilter } from '../../../lib/common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  const logger = app.get(Logger);
  app.useLogger(logger);

  const { port } = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const { url } = app.get<KafkaConfigType>(kafkaConfig.KEY);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [url],
        clientId: 'notification-service',
      },
      consumer: {
        groupId: 'notification-service-group',
      },
    },
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  await app.startAllMicroservices();

  await app.listen(port);
  logger.log(`Server is running on ${port}`);
}

bootstrap().catch((e: Error) => {
  console.error('Error during notification-service bootstrap:', e.message);
});
