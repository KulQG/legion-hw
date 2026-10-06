import { Injectable } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { FindUsersQueryDTO } from './dto/find-users-query.dto';
import { createPaginatedResponse } from '../common/helpers/create-paginated-response';

@Injectable()
export class UsersService {
  constructor(private readonly repository: PrismaService) {}
  async findAll({ limit = 10, page = 1, search }: FindUsersQueryDTO) {
    const where = search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : undefined;

    const [total, users] = await this.repository.$transaction([
      this.repository.soft.user.count({ where }),
      this.repository.soft.user.findMany({
        take: Number(limit),
        skip: Number(limit) * Number(page) - Number(limit),
        omit: { passwordHash: true },
        where,
      }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  async findOne(id: string) {
    return await this.repository.soft.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });
  }

  async findForLogin(email: string) {
    return await this.repository.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: Omit<Prisma.UserUpdateInput, 'id'>) {
    return await this.repository.user.update({
      where: { id },
      data: updateUserDto,
      omit: { passwordHash: true },
    });
  }

  async create(user: Prisma.UserCreateInput) {
    return await this.repository.user.create({ data: user });
  }

  async delete(userId: string) {
    await this.repository.user.update({
      where: { id: userId },
      data: { deleted: true, deletedAt: new Date().toISOString() },
    });
  }
}
