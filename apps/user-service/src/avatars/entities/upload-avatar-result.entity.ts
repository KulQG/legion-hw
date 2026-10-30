import { ApiProperty } from '@nestjs/swagger';
import { PROPERTY_EXAMPLES } from '../../../../../lib/common/constants';

export class UploadAvatarResultEntity {
  @ApiProperty({ example: PROPERTY_EXAMPLES.uuid })
  fileKey!: string;
}
