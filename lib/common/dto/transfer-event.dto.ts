import {
  IsDecimal,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class TransferEventDto {
  @IsUUID()
  userFrom!: string;

  @IsUUID()
  userTo!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsPositive()
  sum!: string;

  @IsUUID()
  id!: string;
}
