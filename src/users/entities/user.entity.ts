import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { PROPERTY_EXAMPLES } from '../../common/constants';

export class UserEntity implements Omit<
  User,
  'deleted' | 'deletedAt' | 'passwordHash'
> {
  @ApiProperty({ example: PROPERTY_EXAMPLES.date })
  birthDate!: Date;

  @ApiProperty({ example: 'I love cats' })
  bio!: string | null;

  @ApiProperty({ example: PROPERTY_EXAMPLES.mail })
  email!: string;

  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  id!: string;

  @ApiProperty({ example: PROPERTY_EXAMPLES.name })
  name!: string;

  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  currentAvatar!: string;

  @ApiProperty({ example: 0 })
  activeAvatarsCount!: number;

  @ApiProperty({ example: [PROPERTY_EXAMPLES.uuid] })
  avatars!: string[];

  @ApiProperty({ example: PROPERTY_EXAMPLES.date })
  createdAt!: Date;

  @ApiProperty({ example: PROPERTY_EXAMPLES.date })
  updatedAt!: Date;

  @ApiProperty({ example: PROPERTY_EXAMPLES.money })
  balance!: Decimal;
}
