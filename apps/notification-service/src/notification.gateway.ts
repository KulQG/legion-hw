import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import { Server, type Socket } from 'socket.io';
import { JwtConfigType, USER_FROM_TOKEN } from '../../../lib/common/types';
import { Inject } from '@nestjs/common';
import jwtConfig from '../../../lib/common/configs/jwt.config';
import { NotificationPayload } from './types';
import { NotificationRepository } from './notification.repository';

interface UserSocket extends Socket {
  data: USER_FROM_TOKEN;
}

@WebSocketGateway()
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly configService: JwtConfigType,
    private readonly repository: NotificationRepository,
  ) {
    this.logger.setContext(NotificationGateway.name);
  }

  @WebSocketServer() io!: Server;

  afterInit(server: Server): void {
    this.logger.info('init gateway');
    server.use((socket, next) => {
      try {
        const token: unknown = socket.handshake.auth.token;
        if (typeof token !== 'string' || !token) {
          throw new Error('Missing token');
        }

        const payload = this.jwtService.verify<Partial<{ sub: string }>>(
          token,
          {
            secret: this.configService.secret,
          },
        );

        if (
          typeof payload !== 'object' ||
          payload === null ||
          !('sub' in payload) ||
          typeof payload.sub !== 'string'
        ) {
          throw new Error('Invalid payload');
        }

        (socket as UserSocket).data.userId = payload.sub;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  async handleConnection(client: UserSocket) {
    const { sockets } = this.io.sockets;

    await client.join(client.data.userId);
    this.logger.info(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets.size}`);

    try {
      await this.sendUnreceivedNotifications(client);
    } catch (e: unknown) {
      this.logger.error(
        { err: e, userId: client.data.userId },
        'Failed to deliver pending notification',
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.info(`Cliend id:${client.id} disconnected`);
  }

  sendNotification(
    notificationId: string,
    notificationData: NotificationPayload,
    userId: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.io
        .to(userId)
        .timeout(5000)
        .emit(
          'notification',
          {
            id: notificationId,
            data: notificationData,
          },
          (_err: Error | null, responses: unknown[]) => {
            resolve(responses.some((response) => response === true));
          },
        );
    });
  }

  async sendUnreceivedNotifications(client: UserSocket) {
    const { userId } = client.data;
    const notifications =
      await this.repository.getUnreceivedNotifications(userId);

    const batchSize = 10;

    for (let offset = 0; offset < notifications.length; offset += batchSize) {
      if (!client.connected) break;

      const batch = notifications.slice(offset, offset + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (notification) => {
          const received = await this.sendNotification(
            notification.id,
            notification.data,
            userId,
          );

          if (received)
            await this.repository.markReceived(notification.id, userId);
        }),
      );

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(
            {
              err: result.reason as unknown,
              notificationId: batch[index].id,
            },
            'Notification delivery failed',
          );
        }
      });
    }
  }
}
