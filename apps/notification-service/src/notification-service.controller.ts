import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { TransferEventDto } from '../../../lib/common/dto/transfer-event.dto';
import { KAFKA_TRANSFERS_TOPIC } from '../../../lib/common/constants';
import { NotificationsService } from './notification-service.service';

@Controller()
export class NotificationServiceController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
    return this.notificationsService.handleEventTransfers(payload, context);
  }
}
