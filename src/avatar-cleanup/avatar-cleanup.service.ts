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
  ) {}

  @Cron('0 0 3 * * 1-7')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @OnOneInstance({ key: 'nightly-cleanup' })
  async startCleanUp() {
    await this.queue.add(CLEANUP_TASK_NAME, null);
    this.logger.info('cleanup task added');
  }

  async cleanUp() {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deletedAvatars = await this.repository.avatar.findMany({
      select: { id: true },
      where: { deletedAt: { lte: threshold } },
      orderBy: { deletedAt: 'asc' },
      take: CLEANUP_BATCH_SIZE,
    });

    if (!deletedAvatars.length) return;

    const deletedAvatarsIds = deletedAvatars.map((da) => da.id);

    const { failed } = await this.fileService.removeFiles({
      paths: deletedAvatarsIds,
    });

    const removedIds = deletedAvatarsIds.filter((id) => !failed.has(id));

    if (removedIds.length) {
      await this.repository.avatar.deleteMany({
        where: { id: { in: removedIds }, deletedAt: { lte: threshold } },
      });
    }

    if (failed.size) {
      throw new Error(`[cleanup task]: ${failed.size} files were not deleted`);
    }

    if (deletedAvatarsIds.length === CLEANUP_BATCH_SIZE) {
      await this.startCleanUp();
    }
  }
}
