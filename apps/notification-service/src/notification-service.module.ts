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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, kafkaConfig, jwtConfig],
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
  providers: [NotificationGateway],
})
export class NotificationServiceModule {}
