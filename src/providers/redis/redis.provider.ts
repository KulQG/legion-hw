import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type RedisClient = Redis;

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const client = new Redis(configService.getOrThrow<string>('REDIS_URL'));

    client.on('error', (err) => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis is connected'));

    return client;
  },
};
