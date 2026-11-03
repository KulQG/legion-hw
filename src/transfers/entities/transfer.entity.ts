import { Decimal } from '@prisma/client/runtime/client';
import { Transfer } from '../../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { PROPERTY_EXAMPLES } from '../../common/constants';

export class TransferEntity implements Transfer {
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  id!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  idempotencyKey!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.money })
  sum!: Decimal;
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  fromAccountId!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  toAccountId!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.date })
  createdAt!: Date;
}
