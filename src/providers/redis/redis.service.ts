import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.provider';
import Redis, { RedisKey } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  getClient() {
    return this.redisClient;
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.redisClient.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async keys(pattern: string) {
    return await this.redisClient.keys(pattern);
  }

  async del(...args: [...keys: RedisKey[]]) {
    await this.redisClient.del(...args);
  }

  async getdel(key: string) {
    return this.redisClient.getdel(key);
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
