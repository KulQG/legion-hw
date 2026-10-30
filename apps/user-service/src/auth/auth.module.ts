import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { RedisModule } from '../providers/redis/redis.module';
import { TokensService } from './services/tokens.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { CookiesService } from './services/cookies.service';
import { LogoutService } from './services/logout.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    RedisModule,
    JwtModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    CookiesService,
    LogoutService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, LogoutService],
})
export class AuthModule {}
