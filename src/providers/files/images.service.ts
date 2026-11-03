import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageService {
  async optimize(
    imageBuffer: Buffer<ArrayBufferLike>,
  ): Promise<{ buffer: Buffer<ArrayBuffer>; mimetype: string }> {
    const { data, info } = await sharp(imageBuffer, {
      limitInputPixels: 50_000_000,
    })
      .rotate()
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    return { buffer: data, mimetype: `image/${info.format}` };
  }
}
