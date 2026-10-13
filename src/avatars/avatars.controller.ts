import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import 'multer';
import { ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { AvatarsService } from './avatars.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { checkFileOnImage } from '../common/helpers/filter-file-by-extension';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { UploadAvatarResultEntity } from './entities/upload-avatar-result.entity';
import { AvatarEntity } from './entities/avatar.entity';
import { USER_FROM_TOKEN } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('avatars')
@UseInterceptors(CacheInterceptor)
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  @ApiResponse({ type: Array<AvatarEntity> })
  async getAvatars(@CurrentUser() user: USER_FROM_TOKEN) {
    return await this.avatarsService.getUserAvatars(user.userId);
  }

  @Post()
  @ApiResponse({ type: UploadAvatarResultEntity })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: checkFileOnImage,
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: USER_FROM_TOKEN,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.avatarsService.create(user.userId, file);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: USER_FROM_TOKEN, @Param('id') id: string) {
    await this.avatarsService.delete(id, user.userId);
  }
}
