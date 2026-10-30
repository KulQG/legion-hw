import { ConfigService } from '@nestjs/config';
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
import { USER_FROM_TOKEN } from '../../../lib/common/types';
import { TransferEventDto } from './dto/transfer-event.dto';

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
    private readonly configService: ConfigService,
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
            secret: this.configService.getOrThrow<string>('JWT_SECRET'),
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
  }

  handleDisconnect(client: Socket) {
    this.logger.info(`Cliend id:${client.id} disconnected`);
  }

  sendNotification(transferData: TransferEventDto) {
    this.io.to(transferData.userFrom).emit('transfer-sent', {
      data: {
        id: transferData.id,
        sum: transferData.sum,
        to: transferData.userTo,
      },
    });
    this.io.to(transferData.userTo).emit('transfer-received', {
      data: {
        id: transferData.id,
        sum: transferData.sum,
        from: transferData.userFrom,
      },
    });
  }
}
