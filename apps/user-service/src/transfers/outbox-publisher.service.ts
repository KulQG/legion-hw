import { Inject, Injectable } from '@nestjs/common';
import { ClientKafkaProxy } from '@nestjs/microservices';
import { defer, lastValueFrom, retry, timeout } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { TRANSFERS_KAFKA_NAME } from './constants';
import { Cron } from '@nestjs/schedule';
import { OutboxRepository } from './outbox.repository';
import { randomUUID } from 'node:crypto';
import {
  KAFKA_RETRY_COUNT,
  KAFKA_RETRY_DELAY_MS,
  KAFKA_SEND_TIMEOUT_MS,
  OUTBOX_MAX_MESSAGES_PER_RUN,
  OUTBOX_PUBLISH_CRON,
} from './outbox-publisher.constants';

@Injectable()
export class OutboxPublisherService {
  constructor(
    @Inject(TRANSFERS_KAFKA_NAME) private readonly kafka: ClientKafkaProxy,
    private readonly repository: OutboxRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxPublisherService.name);
  }

  @Cron(OUTBOX_PUBLISH_CRON, { waitForCompletion: true })
  async publish(): Promise<void> {
    for (let i = 0; i < OUTBOX_MAX_MESSAGES_PER_RUN; i++) {
      const [mes] = await this.repository.claimBatch();
      if (!mes) return;

      const requestId = mes.requestId ?? randomUUID();

      await this.logger.runInContext(
        async () => {
          try {
            await lastValueFrom(
              defer(() =>
                this.kafka.emit<void>(mes.topic, {
                  value: mes.payload,
                  headers: { 'x-request-id': requestId },
                }),
              ).pipe(
                timeout(KAFKA_SEND_TIMEOUT_MS),
                retry({
                  count: KAFKA_RETRY_COUNT,
                  delay: KAFKA_RETRY_DELAY_MS,
                }),
              ),
            );

            this.logger.info(`message ${mes.id} was confirmed`);
          } catch (err) {
            this.logger.error(
              err,
              `message ${mes.id} was not confirmed to Kafka`,
            );
            return;
          }

          try {
            await this.repository.markProcessed(mes.id, mes.claimId);
          } catch (err) {
            this.logger.error(
              err,
              `outbox was not updated for message ${mes.id}`,
            );
          }
        },
        { bindings: { reqId: requestId, outboxId: mes.id } },
      );
    }
  }
}
