import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../generated/prisma/client';

export class UserEntity implements Omit<
  User,
  'deleted' | 'deletedAt' | 'passwordHash'
> {
  @ApiProperty({ example: 20 })
  age!: number;

  @ApiProperty({ example: 'I love cats' })
  bio!: string | null;

  @ApiProperty({ example: 'example@mail.com' })
  email!: string;

  @ApiProperty({ example: '018f3a5a-7b3b-7123-8123-456789abcdef' })
  id!: string;

  @ApiProperty({ example: 'John' })
  name!: string;

  @ApiProperty({ example: '2026-10-02T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-02T10:00:00.000Z' })
  updatedAt!: Date;
}
