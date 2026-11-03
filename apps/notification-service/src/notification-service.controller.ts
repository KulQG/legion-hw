import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { TransferEventDto } from '../../../lib/common/dto/transfer-event.dto';
import { PinoLogger } from 'nestjs-pino';
import { NotificationGateway } from './notification.gateway';
import { KAFKA_TRANSFERS_TOPIC } from '../../../lib/common/constants';
import { randomUUID } from 'node:crypto';
import { NotificationDeduplicatorService } from './notification-deduplicator.service';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly socketGateway: NotificationGateway,
    private readonly deduplicator: NotificationDeduplicatorService,
  ) {
    this.logger.setContext(NotificationServiceController.name);
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => new RpcException('Invalid transfer event'),
    }),
  )
  @EventPattern(KAFKA_TRANSFERS_TOPIC)
  async handleEventTransfers(
    @Payload() payload: TransferEventDto,
    @Ctx() context: KafkaContext,
  ) {
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
