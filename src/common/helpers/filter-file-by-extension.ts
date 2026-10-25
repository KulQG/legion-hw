import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const checkFileOnImage: MulterOptions['fileFilter'] = (_, file, cb) => {
  return /^image\/(jpeg|png|webp)$/.test(file.mimetype)
    ? cb(null, true)
    : cb(new BadRequestException('Only images'), false);
};
