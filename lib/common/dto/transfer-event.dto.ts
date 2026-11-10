import {
  IsDecimal,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
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
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/, {
    message: 'sum must be greater than zero with up to 2 decimal places',
  })
  sum!: string;

  @IsUUID()
  id!: string;
}
