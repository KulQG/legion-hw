import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Delete,
  Req,
  Res,
  Query,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LogoutService } from '../auth/services/logout.service';
import { Request, Response } from 'express';
import { EditUserDTO } from './dto/edit-user.dto';
import { ApiResponse } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { PaginatedEntity } from '../common/dto/paginated.entity';
import { FindUsersQueryDTO } from './dto/find-users-query.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { USER_FROM_TOKEN } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logoutService: LogoutService,
  ) {}

  @Get()
  @ApiResponse({ type: PaginatedEntity(UserEntity) })
  async findAll(@Query() query: FindUsersQueryDTO) {
    return await this.usersService.findAll(query);
  }

  @Get('me')
  @ApiResponse({ type: UserEntity })
  async findMe(@CurrentUser() user: USER_FROM_TOKEN) {
    return await this.usersService.findOne(user.userId);
  }

  @Patch('me')
  @ApiResponse({ type: UserEntity })
  async update(
    @CurrentUser() user: USER_FROM_TOKEN,
    @Body() updateUserDto: EditUserDTO,
  ) {
    return await this.usersService.update(user.userId, updateUserDto);
  }

  @Delete('me')
  async delete(
    @CurrentUser() user: USER_FROM_TOKEN,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersService.delete(user.userId);
    await this.logoutService.logoutUser(req, res);
  }

  @Get(':id')
  @ApiResponse({ type: UserEntity })
  async findOne(@Param('id') id: string) {
    const res = await this.usersService.findOne(id);
    if (!res) throw new NotFoundException('User not found');
    return res;
  }
}
