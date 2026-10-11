import { Body, Controller, Post, UseGuards, Headers } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTransferDTO } from './dto/create-transfer.dto';
import { Decimal } from '../generated/prisma/internal/prismaNamespace';

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  async transfer(
    @CurrentUser() user: { userId: string },
    @Headers('idempotency-key') key: string,
    @Body() dto: CreateTransferDTO,
  ) {
    return await this.transfersService.createTransfer(
      user.userId,
      dto.toUserId,
      new Decimal(dto.amount),
      key,
    );
  }
}
