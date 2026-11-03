import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IUploadedMulterFile } from '../interfaces/upload-file.interface';

export class UploadFilePayloadDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly file!: IUploadedMulterFile;

  @ApiProperty({
    example: '/username/',
  })
  @IsString()
  @IsNotEmpty()
  readonly folder!: string;
}
