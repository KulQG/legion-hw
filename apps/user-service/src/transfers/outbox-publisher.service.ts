import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { randomUUID } from 'node:crypto';
import { ClientKafkaProxy } from '@nestjs/microservices';
import { defer, lastValueFrom, retry, timeout } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { TRANSFERS_KAFKA_NAME } from './constants';
import { Cron, CronExpression } from '@nestjs/schedule';

interface ClaimedOutboxRow {
  id: number;
  topic: string;
  payload: unknown;
  claimId: string;
  lockedUntil: Date;
}

@Injectable()
export class OutboxPublisherService {
  constructor(
    @Inject(TRANSFERS_KAFKA_NAME) private readonly kafka: ClientKafkaProxy,
    private readonly repository: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxPublisherService.name);
  }

  private async claimBatch() {
    const claimId = randomUUID();

    return this.repository.$queryRaw<ClaimedOutboxRow[]>`
      WITH candidates AS (
        SELECT id
        FROM outbox
        WHERE processed_at IS NULL
          AND (locked_until IS NULL OR locked_until <= NOW())
        ORDER BY id ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox AS o
      SET claim_id = ${claimId}::uuid,
          locked_until = NOW() + INTERVAL '1 minute'
      FROM candidates
      WHERE o.id = candidates.id
      RETURNING
        o.id,
        o.topic,
        o.payload,
        o.claim_id AS "claimId",
        o.locked_until AS "lockedUntil"
    `;
  }

  private async markProcessed(id: number, claimId: string) {
    const updated = await this.repository.outbox.updateMany({
      where: { id, processedAt: null, claimId },
      data: { claimId: null, lockedUntil: null, processedAt: new Date() },
    });

    if (updated.count === 0) {
      this.logger.warn(`Message ${id} was not marked processed`);
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
  async publish() {
    const data = await this.claimBatch();

    if (!data.length) return;

    const mes = data[0];
    try {
      await lastValueFrom(
        defer(() => this.kafka.emit<void>(mes.topic, mes.payload)).pipe(
          timeout(10_000),
          retry({ count: 2, delay: 2_000 }),
        ),
      );
    } catch (err) {
      throw new Error(`message ${mes.id} was not confirmed to kafka`, {
        cause: err,
      });
    }
    try {
      await this.markProcessed(mes.id, mes.claimId);
    } catch (err) {
      throw new Error(`outbox was not updated. Message ${mes.id}`, {
        cause: err,
      });
    }
  }
}
