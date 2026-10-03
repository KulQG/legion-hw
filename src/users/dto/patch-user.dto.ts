import { IsEmail, IsInt, MaxLength, Min } from 'class-validator';
import { Prisma } from '../../generated/prisma/client';

export class PatchUserDTO implements Pick<
  Prisma.UserUpdateInput,
  'age' | 'bio' | 'email' | 'name'
> {
  @IsInt()
  @Min(0)
  age?: number;

  @MaxLength(1000)
  bio?: string;

  @IsEmail()
  email?: string;

  @MaxLength(20)
  name?: string;
}
