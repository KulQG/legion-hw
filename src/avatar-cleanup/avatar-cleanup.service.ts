import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  AVATAR_CLEANUP_QUEUE_NAME,
  CLEANUP_TASK_NAME,
} from './avatar-cleanup.constants';
import { PrismaService } from '../providers/prisma/prisma.service';
import { IFileService } from '../providers/files/files.adapter';
import { PinoLogger } from 'nestjs-pino';
import { Cron } from '@nestjs/schedule';
import { OnOneInstance } from '@nestjs/locks';

const CLEANUP_BATCH_SIZE = 100;

@Injectable()
export class AvatarCleanupService {
  constructor(
    @InjectQueue(AVATAR_CLEANUP_QUEUE_NAME) private queue: Queue,
    @Inject() private readonly fileService: IFileService,
    private readonly repository: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AvatarCleanupService.name);
  }

  @Cron('0 0 3 * * 1-7')
  @OnOneInstance({ key: 'nightly-cleanup' })
  async addCleanupTask() {
    await this.queue.add(CLEANUP_TASK_NAME, null, {
      deduplication: { id: 'avatar-cleanup' },
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 30_000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.info('cleanup task added');
  }

  async cleanUp() {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    while (true) {
      const avatars = await this.repository.avatar.findMany({
        select: { id: true, userId: true },
        where: { deletedAt: { lte: threshold } },
        orderBy: [{ deletedAt: 'asc' }, { id: 'asc' }],
        take: CLEANUP_BATCH_SIZE,
      });

      if (!avatars.length) return;

      const paths = avatars.map(({ userId, id }) => `${userId}/${id}`);
      const { failed } = await this.fileService.removeFiles({ paths });

      const removedIds: string[] = [];

      for (const { id, userId } of avatars) {
        if (!failed.has(`${userId}/${id}`)) {
          removedIds.push(id);
        }
      }

      if (removedIds.length) {
        await this.repository.avatar.deleteMany({
          where: {
            id: { in: removedIds },
            deletedAt: { lte: threshold },
          },
        });
      }

      if (failed.size) {
        throw new Error(
          `[cleanup task]: ${failed.size} files were not deleted`,
        );
      }

      if (avatars.length < CLEANUP_BATCH_SIZE) return;
    }
  }
}
