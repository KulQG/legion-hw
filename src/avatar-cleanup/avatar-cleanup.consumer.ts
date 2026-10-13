import { Processor, WorkerHost } from '@nestjs/bullmq';
import {
  AVATAR_CLEANUP_QUEUE_NAME,
  CLEANUP_TASK_NAME,
} from './avatar-cleanup.constants';
import { Job } from 'bullmq';
import { AvatarCleanupService } from './avatar-cleanup.service';

@Processor(AVATAR_CLEANUP_QUEUE_NAME)
export class AvatarCleanupConsumer extends WorkerHost {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name === CLEANUP_TASK_NAME) {
      await this.avatarCleanupService.cleanUp();
    }
  }
}
