import { ApiProperty } from '@nestjs/swagger';
import { Avatar } from '../../generated/prisma/client';
import { PROPERTY_EXAMPLES } from '../../common/constants';

export class AvatarEntity implements Omit<Avatar, 'deletedAt'> {
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  id!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  userId!: string;
  @ApiProperty({ example: PROPERTY_EXAMPLES.date })
  createdAt!: Date;
}
