import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload, RpcException } from '@nestjs/microservices';
import { TransferEventDto } from '../../../lib/common/dto/transfer-event.dto';
import { PinoLogger } from 'nestjs-pino';
import { NotificationGateway } from './notification.gateway';
import { KAFKA_TRANSFERS_TOPIC } from '../../../lib/common/constants';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly socketGateway: NotificationGateway,
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
  handleEventTransfers(
    @Payload()
    payload: TransferEventDto,
  ) {
    this.socketGateway.sendNotification(payload);
  }
}
