import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './providers/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './providers/redis/redis.module';
import { FilesModule } from './providers/files/files.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
