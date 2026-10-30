import { IsDecimal, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TransferEventDto {
  @IsUUID()
  userFrom!: string;

  @IsUUID()
  userTo!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsDecimal({ decimal_digits: '0,' })
  sum!: string;

  @IsUUID()
  id!: string;
}
