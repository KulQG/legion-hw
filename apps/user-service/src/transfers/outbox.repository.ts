import { Injectable } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

interface ClaimedOutboxRow {
  id: number;
  topic: string;
  payload: unknown;
  claimId: string;
  lockedUntil: Date;
}

@Injectable()
export class OutboxRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxRepository.name);
  }

  async claimBatch() {
    const claimId = randomUUID();

    return this.prisma.$queryRaw<ClaimedOutboxRow[]>`
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

  async markProcessed(id: number, claimId: string) {
    const updated = await this.prisma.outbox.updateMany({
      where: { id, processedAt: null, claimId },
      data: { claimId: null, lockedUntil: null, processedAt: new Date() },
    });

    if (updated.count === 0) {
      this.logger.warn(`Message ${id} was not marked processed`);
    }
  }
}
