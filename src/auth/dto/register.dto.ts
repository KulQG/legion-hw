import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
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

  @IsInt()
  @Min(0)
  age!: number;

  @IsOptional()
  @MaxLength(1000)
  bio?: string;
}
