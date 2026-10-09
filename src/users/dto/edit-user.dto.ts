import { IsEmail, IsInt, IsOptional, MaxLength, Min } from 'class-validator';
import { Prisma } from '../../generated/prisma/client';

export class EditUserDTO implements Pick<
  Prisma.UserUpdateInput,
  'age' | 'bio' | 'email' | 'name'
> {
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MaxLength(20)
  name?: string;
}
