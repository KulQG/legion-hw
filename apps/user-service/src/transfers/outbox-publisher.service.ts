import { Inject, Injectable } from '@nestjs/common';
import { ClientKafkaProxy } from '@nestjs/microservices';
import { defer, lastValueFrom, retry, timeout } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { TRANSFERS_KAFKA_NAME } from './constants';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository } from './outbox.repository';

@Injectable()
export class OutboxPublisherService {
  constructor(
    @Inject(TRANSFERS_KAFKA_NAME) private readonly kafka: ClientKafkaProxy,
    private readonly repository: OutboxRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OutboxPublisherService.name);
  }

  @Cron(CronExpression.EVERY_5_SECONDS, { waitForCompletion: true })
  async publish() {
    const data = await this.repository.claimBatch();

    if (!data.length) return;

    const mes = data[0];
    try {
      await lastValueFrom(
        defer(() => this.kafka.emit<void>(mes.topic, mes.payload)).pipe(
          timeout(10_000),
          retry({ count: 2, delay: 2_000 }),
        ),
      );
      this.logger.info(`message ${mes.id} was confirmed`);
    } catch (err) {
      throw new Error(`message ${mes.id} was not confirmed to kafka`, {
        cause: err,
      });
    }
    try {
      await this.repository.markProcessed(mes.id, mes.claimId);
    } catch (err) {
      throw new Error(`outbox was not updated. Message ${mes.id}`, {
        cause: err,
      });
    }
  }
}
