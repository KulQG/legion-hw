import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { Decimal } from '../generated/prisma/internal/prismaNamespace';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class TransfersService {
  constructor(
    private readonly repository: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransfersService.name);
  }

  async createTransfer(
    userFrom: string,
    userTo: string,
    amount: Decimal,
    idempotencyKey: string,
  ) {
    if (amount.lte(0)) throw new BadRequestException('Amount must be positive');
    if (userFrom === userTo) throw new BadRequestException('Same account');

    await this.repository.$transaction(async (tx) => {
      const users = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "users" 
        WHERE id IN (${userFrom}::uuid, ${userTo}:uuid) AND "deleted_at" IS NULL
        ORDER BY id 
        FOR UPDATE
      `;

      if (users.length !== 2) throw new NotFoundException('user not found');

      const { count } = await tx.transfer.createMany({
        data: {
          idempotencyKey,
          sum: amount,
          fromAccountId: userFrom,
          toAccountId: userTo,
        },
        skipDuplicates: true,
      });

      if (count === 0) return;

      const debit = await tx.user.updateMany({
        where: { id: userFrom, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debit.count === 0)
        throw new UnprocessableEntityException('Insufficient funds');

      await tx.user.update({
        where: { id: userTo },
        data: { balance: { increment: amount } },
      });
    });

    return this.repository.transfer.findUniqueOrThrow({
      where: { idempotencyKey },
    });
  }
}
