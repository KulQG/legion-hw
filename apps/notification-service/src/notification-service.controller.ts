import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransferEventDto } from './dto/transfer-event.dto';
import { PinoLogger } from 'nestjs-pino';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotificationGateway } from './notification.gateway';

@Controller()
export class NotificationServiceController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly socketGateway: NotificationGateway,
  ) {
    this.logger.setContext(NotificationServiceController.name);
  }

  @EventPattern('transfers')
  async handleEventTransfers(
    @Payload()
    payload?: TransferEventDto | null,
  ) {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      const errors = await validate(plainToInstance(TransferEventDto, payload));

      if (errors.length) {
        this.logger.warn(errors, 'event is not processed');
        return;
      }

      this.socketGateway.sendNotification(payload);
    } else {
      this.logger.warn('event is not processed. Event is not an object');
    }
  }
}
