import { Injectable } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';

@Injectable()
export class AvatarsService {
  constructor(private readonly repository: PrismaService) {}

  async create(userId: string, fileKey: string) {
    await this.repository.avatar.create({
      data: { id: fileKey, userId },
    });
  }

  async delete(id: string) {
    await this.repository.avatar.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date().toISOString() },
    });
  }
}
