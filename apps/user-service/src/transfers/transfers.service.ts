import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { Decimal } from '../generated/prisma/internal/prismaNamespace';
import { PinoLogger } from 'nestjs-pino';
import { TransferEventDto } from '../../../../lib/common/dto/transfer-event.dto';
import { KAFKA_TRANSFERS_TOPIC } from '../../../../lib/common/constants';

@Injectable()
export class TransfersService {
  constructor(
    private readonly repository: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransfersService.name);
  }

  private validateExistingTransfer(
    transfer: {
      fromAccountId: string;
      toAccountId: string;
      sum: Decimal;
    },
    userFrom: string,
    userTo: string,
    amount: Decimal,
  ): void {
    if (
      transfer.fromAccountId !== userFrom ||
      transfer.toAccountId !== userTo ||
      !transfer.sum.eq(amount)
    ) {
      throw new ConflictException(
        'Idempotency key already used with different parameters',
      );
    }
  }

  async createTransfer(
    userFrom: string,
    userTo: string,
    amount: Decimal,
    idempotencyKey: string,
  ) {
    if (amount.lte(0)) throw new BadRequestException('Amount must be positive');
    if (userFrom === userTo) throw new BadRequestException('Same account');

    const transfer = await this.repository.$transaction(async (tx) => {
      const existing = await tx.transfer.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        this.validateExistingTransfer(existing, userFrom, userTo, amount);
        return existing;
      }

      const users = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "users"
        WHERE id IN (${userFrom}::uuid, ${userTo}::uuid)
        AND "deleted_at" IS NULL
        ORDER BY id
        FOR UPDATE
      `;

      if (users.length !== 2) {
        this.logger.error('[create transfer]: user not found');
        throw new NotFoundException('user not found');
      }

      const { count } = await tx.transfer.createMany({
        data: {
          idempotencyKey,
          sum: amount,
          fromAccountId: userFrom,
          toAccountId: userTo,
        },
        skipDuplicates: true,
      });

      if (count === 0) {
        const existing = await tx.transfer.findUniqueOrThrow({
          where: { idempotencyKey },
        });

        this.validateExistingTransfer(existing, userFrom, userTo, amount);
        return existing;
      }

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

      const transfer = await tx.transfer.findUniqueOrThrow({
        where: { idempotencyKey },
      });

      const outboxPayload = {
        id: transfer.id,
        idempotencyKey: transfer.idempotencyKey,
        sum: transfer.sum.toString(),
        userFrom: transfer.fromAccountId,
        userTo: transfer.toAccountId,
      } satisfies TransferEventDto;

      await tx.outbox.create({
        data: {
          topic: KAFKA_TRANSFERS_TOPIC,
          payload: outboxPayload,
        },
      });

      return transfer;
    });

    return transfer;
  }
}
