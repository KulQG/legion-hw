import { IsUUID, Matches } from 'class-validator';

export class CreateTransferDTO {
  @IsUUID()
  toUserId!: string;

  @Matches(/^\d{1,12}(\.\d{1,2})?$/, {
    message: 'Invalid amount. Expected: "0.00"',
  })
  amount!: string;
}
