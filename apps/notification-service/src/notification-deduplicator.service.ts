import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import redisConfig from '../../../lib/common/configs/redis.config';
import { RedisConfigType } from '../../../lib/common/types';

const DEDUP_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class NotificationDeduplicatorService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(@Inject(redisConfig.KEY) config: RedisConfigType) {
    this.redis = new Redis(config.url);
  }

  async shouldEmit(transferId: string): Promise<boolean> {
    const key = `notification:transfer:${transferId}`;

    const result = await this.redis.set(
      key,
      '1',
      'EX',
      DEDUP_TTL_SECONDS,
      'NX',
    );

    return result === 'OK';
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
