import { ConfigType } from '@nestjs/config';
import mongoConfig from './mongo.config';

export type MongoConfigType = ConfigType<typeof mongoConfig>;
