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
import { NotificationsService } from './notification-service.service';
import mongoConfig from '../config/mongo.config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfigType } from '../config/notification-service-configs.types';
import {
  Notification,
  NotificationSchema,
} from './providers/mongo/notification.schema';
import { NotificationRepository } from './notification.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mongoConfig, kafkaConfig, jwtConfig],
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
    MongooseModule.forRootAsync({
      inject: [mongoConfig.KEY],
      useFactory: (config: MongoConfigType) => ({
        uri: config.url,
      }),
    }),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationGateway,
    NotificationsService,
    NotificationRepository,
  ],
})
export class NotificationServiceModule {}
