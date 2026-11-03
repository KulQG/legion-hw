import { ConfigType } from '@nestjs/config';
import appConfig from './app.config';
import dbConfig from './db.config';
import redisConfig from './redis.config';
import minioConfig from './minio.config';

export type AppConfigType = ConfigType<typeof appConfig>;
export type DBConfigType = ConfigType<typeof dbConfig>;
export type RedisConfigType = ConfigType<typeof redisConfig>;
export type MinioConfigType = ConfigType<typeof minioConfig>;
