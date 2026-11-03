import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new AWS.S3({
          endpoint: configService.getOrThrow<string>('MINIO_URL'),
          region: 'ru-central1',
          credentials: {
            accessKeyId: configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
            secretAccessKey:
              configService.getOrThrow<string>('MINIO_SECRET_KEY'),
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
