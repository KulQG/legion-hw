import { IsUUID } from 'class-validator';

export class CreateTransferHeadersDto {
  @IsUUID()
  'idempotency-key'!: string;
}
