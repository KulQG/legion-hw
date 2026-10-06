import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const client = createClient({
      url: configService.get<string>('REDIS_URL')!,
    });

    client.on('error', (err) => console.error('Redis Client Error', err));

    await client.connect();

    client.on('connect', () => console.log('Redis is connected'));

    return client;
  },
};
