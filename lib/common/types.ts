import { ConfigType } from '@nestjs/config';
import jwtConfig from './configs/jwt.config';
import kafkaConfig from './configs/kafka.config';
import redisConfig from './configs/redis.config';

export interface USER_FROM_TOKEN {
  userId: string;
}

export type JwtConfigType = ConfigType<typeof jwtConfig>;
export type KafkaConfigType = ConfigType<typeof kafkaConfig>;
export type RedisConfigType = ConfigType<typeof redisConfig>;
