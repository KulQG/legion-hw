import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { S3Service } from './s3.service';
import minioConfig from '../../../../config/minio.config';
import { MinioConfigType } from '../../../../config/user-service-config.types';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [minioConfig.KEY],
      useFactory: (configService: MinioConfigType) => {
        return new AWS.S3({
          endpoint: configService.url,
          region: 'ru-central1',
          credentials: {
            accessKeyId: configService.access_key,
            secretAccessKey: configService.secret_key,
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
