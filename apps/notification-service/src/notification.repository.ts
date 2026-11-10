import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './providers/mongo/notification.schema';
import { PinoLogger } from 'nestjs-pino';
import { SaveNotificationReturnedValue } from './types';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationRepository.name);
  }

  async save(
    userId: string,
    eventId: string,
    notificationObject: Notification['data'],
  ): Promise<SaveNotificationReturnedValue> {
    try {
      const notification = await this.notificationModel
        .findOneAndUpdate(
          { eventId, userId },
          {
            $setOnInsert: {
              userId,
              eventId,
              data: notificationObject,
              received: false,
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
          },
        )
        .exec();

      return {
        id: notification._id.toString(),
        received: notification.received,
      };
    } catch (e) {
      throw new Error('notification is not saved', { cause: e });
    }
  }

  async markReceived(notificationId: string, userId: string) {
    try {
      const result = await this.notificationModel
        .updateOne(
          { _id: notificationId, userId },
          { $set: { received: true } },
        )
        .exec();

      return result.matchedCount > 0;
    } catch (e) {
      throw new Error('notification was not updated', { cause: e });
    }
  }

  async getUnreceivedNotifications(userId: string) {
    const result = await this.notificationModel
      .find({
        userId,
        received: false,
      })
      .select({ _id: 1, data: 1 })
      .lean()
      .exec();
    return result.map((n) => ({
      id: n._id.toString(),
      data: n.data,
    }));
  }
}
