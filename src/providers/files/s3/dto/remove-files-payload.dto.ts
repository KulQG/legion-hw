import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class RemoveFilesPayloadDto {
  @ApiProperty({
    example: ['/profiles/avatars/123'],
  })
  @IsArray()
  @IsNotEmpty()
  readonly paths!: string[];
}
