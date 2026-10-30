import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [
          createKeyv(config.getOrThrow('REDIS_URL'), { namespace: 'cache' }),
        ],
        ttl: 30_000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: config.getOrThrow('REDIS_URL'),
      }),
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot(LOGGER_CONFIG),
    ConfigModule.forRoot({ isGlobal: true }),
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
