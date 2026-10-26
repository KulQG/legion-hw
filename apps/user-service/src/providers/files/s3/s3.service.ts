import {
  S3,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { IFileService } from '../files.adapter';
import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { RemoveException } from './exceptions/remove.exception';
import { UploadException } from './exceptions/upload.exception';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto';
import { UploadFileResultDto } from './dto/upload-file-result.dto';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto';
import { randomUUID } from 'node:crypto';
import { RemoveFilesPayloadDto } from './dto/remove-files-payload.dto';

@Injectable()
export class S3Service extends IFileService {
  private readonly logger = new Logger(S3Service.name);

  private readonly bucketName = 'avatars';

  constructor(@Inject(S3Lib) private readonly S3: S3) {
    super();
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file } = dto;
    const fileKey = randomUUID();
    const path = `${folder}/${fileKey}`;

    try {
      this.logger.log('📁 Beginning of uploading file to bucket');

      await this.S3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          Body: file.buffer,
          ACL: 'public-read',
          ContentType: file.mimetype,
        }),
      );

      this.logger.log('✅ Uploading was successful');

      return { fileKey };
    } catch (error) {
      this.logger.error(`❌ File upload error with path: ${path}`);
      throw new UploadException((error as Error).message);
    }
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.log('🗑️ Beginning of removing file from bucket');

    try {
      await this.S3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        }),
      );

      this.logger.log('✅ Removing was successful');
    } catch (error) {
      this.logger.error(`❌ File remove error with path: ${path}`);
      throw new RemoveException((error as Error).message);
    }
  }

  async removeFiles(
    dto: RemoveFilesPayloadDto,
  ): Promise<{ failed: Set<string> }> {
    const { paths } = dto;
    const failed: Set<string> = new Set();

    this.logger.log('🗑️ Beginning of removing several files from bucket');

    const res = await this.S3.send(
      new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: { Objects: paths.map((Key) => ({ Key })), Quiet: true },
      }),
    );

    if (!res.Errors || res.Errors.length === 0) {
      this.logger.log('✅ Removing was successful');
    } else {
      for (const err of res.Errors) {
        this.logger.error(
          `[s3 delete]: ${err.Key} failed: ${err.Code} ${err.Message}`,
        );
        if (err.Key) failed.add(err.Key);
      }
    }

    return { failed };
  }
}
