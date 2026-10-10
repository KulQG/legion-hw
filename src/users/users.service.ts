import { Injectable } from '@nestjs/common';
import { PrismaService } from '../providers/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { FindUsersQueryDTO } from './dto/find-users-query.dto';
import { createPaginatedResponse } from '../common/helpers/create-paginated-response';
import { getDateByYearsAgo } from '../common/helpers/get-date-by-years-ago';

const ACTIVE_USERS_MIN_AVATARS_COUNT = 2;

@Injectable()
export class UsersService {
  private searchFilter: (
    search: string,
  ) => Partial<Prisma.UserWhereUniqueInput>;
  private ageFilter: (filters: {
    minAge?: number;
    maxAge?: number;
  }) => Partial<Prisma.UserWhereUniqueInput>;

  constructor(private readonly repository: PrismaService) {
    this.searchFilter = (search) => ({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    });
    this.ageFilter = ({ minAge, maxAge }) => ({
      birthDate: {
        ...(minAge !== undefined && { lte: getDateByYearsAgo(minAge) }),
        ...(maxAge !== undefined && { gte: getDateByYearsAgo(maxAge, 1) }),
      },
    });
  }

  async findAll({
    limit = 10,
    page = 1,
    search,
    maxAge,
    minAge,
    isActive,
  }: FindUsersQueryDTO) {
    const activeUsersFilter: Partial<Prisma.UserWhereUniqueInput> = {
      AND: [
        { activeAvatarsCount: { gte: ACTIVE_USERS_MIN_AVATARS_COUNT } },
        { NOT: { bio: null } },
      ],
    };

    const where: Partial<Prisma.UserWhereUniqueInput> | undefined = {
      ...this.ageFilter({ maxAge, minAge }),
      ...(search ? this.searchFilter(search) : {}),
      ...(isActive ? activeUsersFilter : {}),
    };

    const [total, users] = await this.repository.$transaction([
      this.repository.soft.user.count({ where }),
      this.repository.soft.user.findMany({
        take: Number(limit),
        skip: Number(limit) * Number(page) - Number(limit),
        omit: { passwordHash: true },
        where,
        orderBy: { id: 'desc' },
      }),
    ]);

    return createPaginatedResponse(users, total, page, limit);
  }

  async findOne(id: string) {
    return this.repository.soft.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });
  }

  async findOneWithAvatars(id: string) {
    return this.repository.soft.user.findUnique({
      where: { id },
      include: { avatars: { where: { deletedAt: null } } },
      omit: { passwordHash: true },
    });
  }

  async findForLogin(email: string) {
    return this.repository.soft.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: Omit<Prisma.UserUpdateInput, 'id'>) {
    return this.repository.user.update({
      where: { id },
      data: updateUserDto,
      omit: { passwordHash: true },
    });
  }

  async create(user: Prisma.UserCreateInput) {
    return this.repository.user.create({ data: user });
  }

  async delete(userId: string) {
    await this.repository.$executeRaw`
      UPDATE "users"
      SET email = 'deleted:' || id || ':' || email,
          "deleted_at" = NOW()
      WHERE id = ${userId} AND "deleted_at" IS NULL
    `;
  }
}
