import {
  IsDate,
  IsEmail,
  IsOptional,
  MaxDate,
  MaxLength,
} from 'class-validator';
import { Prisma } from '../../generated/prisma/client';

export class EditUserDTO implements Pick<
  Prisma.UserUpdateInput,
  'birthDate' | 'bio' | 'email' | 'name'
> {
  @IsOptional()
  @IsDate()
  @MaxDate(() => new Date())
  birthDate?: Date;

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
