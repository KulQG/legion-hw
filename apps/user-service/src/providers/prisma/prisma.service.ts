import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import dbConfig from '../../../config/db.config';
import { DBConfigType } from '../../../config/user-service-config.types';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public soft!: ReturnType<typeof this.getSoftClient>;

  constructor(
    @Inject(dbConfig.KEY)
    private readonly configService: DBConfigType,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.url,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();

    this.soft = this.getSoftClient();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // autofilter soft deleted
  private getSoftClient() {
    return this.$extends({
      query: {
        $allModels: {
          $allOperations: ({ args, query }) => {
            if ('where' in args) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
        },
      },
    });
  }
}
