import { Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class SharpPipe
  implements PipeTransform<Express.Multer.File, Promise<string>>
{
  constructor() {}

  async transform(images: Express.Multer.File): Promise<string> {
    const originalName = path.parse(images.originalname).name;

    const filename = originalName + '.webp';
    console.log(filename);

    await sharp(images.buffer)
      .resize({ width: 600 })
      .webp({ quality: 100 })
      .toFile(path.join('uploads', filename));

    return filename;
  }
}
