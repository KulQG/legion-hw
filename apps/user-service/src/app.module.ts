import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './providers/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './providers/redis/redis.module';
import { FilesModule } from './providers/files/files.module';
import { AvatarsModule } from './avatars/avatars.module';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { getRequestId } from '../../../lib/common/helpers/get-request-id';
import { LOGGER_CONFIG } from '../../../lib/common/configs/logger-config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { TransfersModule } from './transfers/transfers.module';
import { AvatarCleanupModule } from './avatar-cleanup/avatar-cleanup.module';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from '../config/app.config';
import jwtConfig from '../../../lib/common/configs/jwt.config';
import dbConfig from '../config/db.config';
import minioConfig from '../config/minio.config';
import redisConfig from '../config/redis.config';
import { RedisConfigType } from '../config/user-service-config.types';
import kafkaConfig from '../../../lib/common/configs/kafka.config';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: getRequestId,
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [redisConfig.KEY],
      useFactory: (config: RedisConfigType) => ({
        stores: [createKeyv(config.url, { namespace: 'cache' })],
        ttl: 30_000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (config: RedisConfigType) => ({
        connection: {
          url: config.url,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(LOGGER_CONFIG),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        kafkaConfig,
        jwtConfig,
        dbConfig,
        minioConfig,
        redisConfig,
      ],
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    RedisModule,
    FilesModule,
    AvatarsModule,
    TransfersModule,
    AvatarCleanupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
