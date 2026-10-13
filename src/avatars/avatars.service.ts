import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { UserUpdateInput } from '../generated/prisma/models';
import { PinoLogger } from 'nestjs-pino';
import { ImageService } from '../providers/files/images.service';
import { IFileService } from '../providers/files/files.adapter';

const AVATARS_LIMIT = 5;

@Injectable()
export class AvatarsService {
  constructor(
    private readonly repository: PrismaService,
    private readonly logger: PinoLogger,
    @Inject() private readonly fileService: IFileService,
    private readonly imageService: ImageService,
  ) {
    this.logger.setContext(AvatarsService.name);
  }

  async getUserAvatars(userId: string) {
    const avatars = await this.repository.soft.avatar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!avatars.length) throw new NotFoundException('No avatars yet');

    return avatars;
  }

  async create(userId: string, file: Express.Multer.File) {
    // TODO: создать отдельную джобу на конвертацию
    const { buffer, mimetype } = await this.imageService.optimize(file.buffer);

    const { fileKey } = await this.fileService.uploadFile({
      file: { buffer, mimetype },
      folder: userId,
    });

    try {
      await this.repository.$transaction(async (tx) => {
        const [user] = await tx.$queryRaw<{ activeAvatarsCount: number }[]>`
          SELECT "active_avatars_count" AS "activeAvatarsCount" FROM "users" 
          WHERE "id" = ${userId}::uuid AND "deleted_at" IS NULL
          FOR UPDATE
        `;

        if (!user) {
          this.logger.error(`[create avatar]: user [${userId}] not found`);
          throw new NotFoundException();
        }

        if (user.activeAvatarsCount >= AVATARS_LIMIT) {
          throw new ForbiddenException(
            `The avatars limit has been reached: ${AVATARS_LIMIT}`,
          );
        }

        await tx.avatar.create({ data: { id: fileKey, userId } });

        await tx.user.update({
          where: { id: userId },
          data: {
            currentAvatar: fileKey,
            activeAvatarsCount: { increment: 1 },
          },
        });

        this.logger.info(
          `[create avatar] avatar [${fileKey}] added for user [${userId}]`,
        );
      });

      return { fileKey };
    } catch (e) {
      await this.fileService.removeFile({ path: fileKey });
      throw e;
    }
  }

  async delete(userId: string, id: string) {
    await this.repository.$transaction(async (tx) => {
      const [user] = await tx.$queryRaw<{ currentAvatar: string | null }[]>`
        SELECT "current_avatar" AS "currentAvatar" FROM "users"
        WHERE "id" = ${userId}::uuid AND "deleted_at" IS NULL
        FOR UPDATE
      `;

      if (!user) {
        this.logger.error(`[delete avatar]: user [${userId}] not found`);
        throw new NotFoundException();
      }

      const { count } = await tx.avatar.updateMany({
        where: { id, userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (!count) {
        throw new NotFoundException('Avatar not found');
      }

      const data: UserUpdateInput = {
        activeAvatarsCount: { decrement: 1 },
      };

      if (user.currentAvatar === id) {
        const last = await tx.avatar.findFirst({
          where: { userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });
        data.currentAvatar = last?.id ?? null;
      }

      await tx.user.update({ where: { id: userId }, data });

      this.logger.info(
        `[delete avatar]: avatar [${id}] deleted; user [${userId}]`,
      );
    });
  }
}
