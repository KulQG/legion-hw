import { Module } from '@nestjs/common';
import { AvatarCleanupService } from './avatar-cleanup.service';
import { AvatarCleanupController } from './avatar-cleanup.controller';
import { BullModule } from '@nestjs/bullmq';
import { AVATAR_CLEANUP_QUEUE_NAME } from './avatar-cleanup.constants';
import { FilesModule } from '../providers/files/files.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: AVATAR_CLEANUP_QUEUE_NAME }),
    FilesModule,
  ],
  controllers: [AvatarCleanupController],
  providers: [AvatarCleanupService],
})
export class AvatarCleanupModule {}
