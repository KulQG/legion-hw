import { Injectable } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { TransferEventDto } from '../../../lib/common/dto/transfer-event.dto';
import { PinoLogger } from 'nestjs-pino';
import { NotificationDeduplicatorService } from './notification-deduplicator.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly deduplicator: NotificationDeduplicatorService,
    private readonly socketGateway: NotificationGateway,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  async handleEventTransfers(payload: TransferEventDto, context: KafkaContext) {
    const header = context.getMessage().headers?.['x-request-id'];

    const receivedId =
      typeof header === 'string'
        ? header
        : Buffer.isBuffer(header)
          ? header.toString('utf8')
          : undefined;

    const requestId =
      receivedId && receivedId.length <= 128 ? receivedId : randomUUID();

    await this.logger.runInContext(
      async () => {
        const shouldEmit = await this.deduplicator.shouldEmit(payload.id);

        if (!shouldEmit) {
          this.logger.info('duplicate transfer notification skipped');
          return;
        }

        this.socketGateway.sendNotification(payload);
        this.logger.info('transfer notification emitted');
      },
      { bindings: { reqId: requestId, transferId: payload.id } },
    );
  }
}
