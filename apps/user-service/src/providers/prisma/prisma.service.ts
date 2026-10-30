import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public soft!: ReturnType<typeof this.getSoftClient>;

  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
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
