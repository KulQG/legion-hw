import { ApiProperty } from '@nestjs/swagger';
import { PROPERTY_EXAMPLES } from '../../../../../lib/common/constants';

export class LoginEntity {
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  access_token!: string;
}
