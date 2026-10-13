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

@UseGuards(JwtAuthGuard)
@Controller('avatars')
@UseInterceptors(CacheInterceptor)
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  async getAvatars(@CurrentUser() user: { userId: string }) {
    return await this.avatarsService.getUserAvatars(user.userId);
  }

  @Post()
  @ApiResponse({ type: String })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
      fileFilter: checkFileOnImage,
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.avatarsService.create(user.userId, file);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    await this.avatarsService.delete(id, user.userId);
  }
}
