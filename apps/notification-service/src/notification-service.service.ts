import { Injectable } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { TransferEventDto } from '../../../lib/common/dto/transfer-event.dto';
import { PinoLogger } from 'nestjs-pino';
import { NotificationGateway } from './notification.gateway';
import { NotificationRepository } from './notification.repository';
import {
  NotificationPayload,
  SaveNotificationReturnedValue,
  TransferReceivedNotification,
  TransferSentNotification,
} from './types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly socketGateway: NotificationGateway,
    private readonly repository: NotificationRepository,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  private async send(
    saveNotificationResult: SaveNotificationReturnedValue,
    notificationData: NotificationPayload,
    userId: string,
  ) {
    if (!saveNotificationResult.received) {
      const received = await this.socketGateway.sendNotification(
        saveNotificationResult.id,
        notificationData,
        userId,
      );

      if (received) {
        await this.repository.markReceived(saveNotificationResult.id, userId);
      }
    }
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

    const userFromNotification = {
      sum: payload.sum,
      toUser: payload.userTo,
      transferId: payload.id,
      type: 'transfer-sent',
    } satisfies TransferSentNotification;

    const userToNotification = {
      sum: payload.sum,
      fromUser: payload.userFrom,
      transferId: payload.id,
      type: 'transfer-received',
    } satisfies TransferReceivedNotification;

    await this.logger.runInContext(
      async () => {
        const [userFromSavedNotification, userToSavedNotification] =
          await Promise.all([
            this.repository.save(
              payload.userFrom,
              payload.idempotencyKey,
              userFromNotification,
            ),
            this.repository.save(
              payload.userTo,
              payload.idempotencyKey,
              userToNotification,
            ),
          ]);

        await context.getConsumer().commitOffsets([
          {
            topic: context.getTopic(),
            partition: context.getPartition(),
            offset: (BigInt(context.getMessage().offset) + 1n).toString(),
          },
        ]);

        await Promise.allSettled([
          this.send(
            userFromSavedNotification,
            userFromNotification,
            payload.userFrom,
          ).catch((err: unknown) => {
            this.logger.error(
              { err, notificationId: userFromSavedNotification.id },
              'Notification delivery failed',
            );
          }),
          this.send(
            userToSavedNotification,
            userToNotification,
            payload.userTo,
          ).catch((err: unknown) => {
            this.logger.error(
              { err, notificationId: userToSavedNotification.id },
              'Notification delivery failed',
            );
          }),
        ]);
      },
      {
        bindings: { reqId: requestId, transferId: payload.id },
      },
    );
  }
}
