import {
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
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
import { IFileService } from '../providers/files/files.adapter';
import { ImageService } from '../providers/files/images.service';
import { AvatarsService } from './avatars.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { checkFileOnImage } from '../common/helpers/filter-file-by-extension';
import { CacheInterceptor } from '@nestjs/cache-manager';

@UseGuards(JwtAuthGuard)
@Controller('avatars')
@UseInterceptors(CacheInterceptor)
export class AvatarsController {
  constructor(
    @Inject() private readonly fileService: IFileService,
    private readonly imageService: ImageService,
    private readonly avatarsService: AvatarsService,
  ) {}

  @Get()
  async getAvatars(@CurrentUser() user: { userId: string }) {
    const avatars = await this.avatarsService.getUserAvatars(user.userId);
    if (!avatars.length) throw new NotFoundException('No avatars yet');
    return avatars;
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
    const { buffer, mimetype } = await this.imageService.optimize(file.buffer);

    const { fileKey } = await this.fileService.uploadFile({
      file: { buffer, mimetype },
      folder: user.userId,
    });

    await this.avatarsService.create(user.userId, fileKey);

    return fileKey;
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    await this.avatarsService.delete(id, user.userId);
  }
}
