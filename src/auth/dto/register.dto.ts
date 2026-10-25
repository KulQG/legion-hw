import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MaxDate,
  MaxLength,
} from 'class-validator';

export class RegisterDTO {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MaxLength(20)
  name!: string;

  @IsNotEmpty()
  @MaxLength(20)
  password!: string;

  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date())
  birthDate!: Date;

  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}
