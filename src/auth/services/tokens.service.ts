import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../providers/redis/redis.service';
import { randomUUID } from 'node:crypto';

type JwtAccessPayload = { sub: string; email: string };
type JwtRefreshPayload = JwtAccessPayload & { jti: string };

const REFRESH_TOKEN_START_KEY = 'refresh_token';

@Injectable()
export class TokensService {
  private readonly secretRefresh: string;
  private readonly secretAccess: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {
    this.secretRefresh = this.configService.get<string>('REFRESH_JWT_SECRET')!;
    this.secretAccess = this.configService.get<string>('JWT_SECRET')!;
  }

  private generateRefreshTokenKey(userId: string, jti: string) {
    return `${REFRESH_TOKEN_START_KEY}:${userId}:${jti}`;
  }

  private async getRefreshPayload(refreshToken: string) {
    let payload: JwtRefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshToken,
        {
          secret: this.secretRefresh,
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token error');
    }

    return payload;
  }

  async generateTokens(userId: string, email: string) {
    const payload_access_token: JwtAccessPayload = { sub: userId, email };
    const jti = randomUUID();
    const payload_refresh_token: JwtRefreshPayload = {
      ...payload_access_token,
      jti,
    };

    const access_token = await this.jwtService.signAsync(payload_access_token, {
      secret: this.secretAccess,
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(
      payload_refresh_token,
      {
        secret: this.secretRefresh,
        expiresIn: '7d',
      },
    );

    const redisKey = this.generateRefreshTokenKey(userId, jti);
    await this.redisService.set(redisKey, 'valid', 7 * 24 * 60 * 60);

    return { access_token, refresh_token };
  }

  async refreshTokens(refreshToken: string) {
    const {
      sub: userId,
      email,
      jti,
    } = await this.getRefreshPayload(refreshToken);

    const redisKey = this.generateRefreshTokenKey(userId, jti);

    const isSessionValid = await this.redisService.get(redisKey);

    if (!isSessionValid)
      throw new UnauthorizedException('Session is not valid');

    await this.redisService.del(redisKey);

    return await this.generateTokens(userId, email);
  }

  async revokeToken(refreshToken: string) {
    const { sub: userId, jti } = await this.getRefreshPayload(refreshToken);

    const redisKey = this.generateRefreshTokenKey(userId, jti);
    await this.redisService.del(redisKey);
  }

  async revokeUserSessions(userId: string) {
    const keys = await this.redisService.keys(
      `${REFRESH_TOKEN_START_KEY}:${userId}:*`,
    );

    if (keys.length > 0) {
      await this.redisService.del(...keys);
    }
  }
}
