import { ApiProperty } from '@nestjs/swagger';

export class LoginEntity {
  @ApiProperty({ example: '018f3a5a-7b3b-7123-8123-456789abcdef' })
  access_token!: string;
}
