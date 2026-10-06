import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

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
          async findMany({ args, query }) {
            args.where = { ...args.where, deleted: false };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, deleted: false };
            return query(args);
          },
          async findUnique({ args, query }) {
            args.where = { ...args.where, deleted: false };
            return query(args);
          },
          async count({ args, query }) {
            args.where = { ...args.where, deleted: false };
            return query(args);
          },
        },
      },
    });
  }
}
