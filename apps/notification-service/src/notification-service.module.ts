import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationGateway } from './notification.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { LOGGER_CONFIG } from '../../../lib/common/configs/logger-config';
import { ClsModule } from 'nestjs-cls';
import { getRequestId } from '../../../lib/common/helpers/get-request-id';
import appConfig from '../config/app.config';
import kafkaConfig from '../../../lib/common/configs/kafka.config';
import jwtConfig from '../../../lib/common/configs/jwt.config';
import { NotificationDeduplicatorService } from './notification-deduplicator.service';
import redisConfig from '../../../lib/common/configs/redis.config';
import { NotificationsService } from './notification-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, kafkaConfig, jwtConfig, redisConfig],
    }),
    JwtModule.register({}),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: getRequestId,
      },
    }),
    LoggerModule.forRoot(LOGGER_CONFIG),
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationGateway,
    NotificationDeduplicatorService,
    NotificationsService,
  ],
})
export class NotificationServiceModule {}
