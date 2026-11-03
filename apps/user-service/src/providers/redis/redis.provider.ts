import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import redisConfig from '../../../config/redis.config';
import { RedisConfigType } from '../../../config/user-service-config.types';

export type RedisClient = Redis;

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [redisConfig.KEY],
  useFactory: (configService: RedisConfigType) => {
    const client = new Redis(configService.url);

    client.on('error', (err) => console.error('Redis Client Error', err));
    client.on('connect', () => console.log('Redis is connected'));

    return client;
  },
};
