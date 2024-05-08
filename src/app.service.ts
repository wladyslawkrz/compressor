import { Injectable } from "@nestjs/common";
import { join } from "path";
import { randomUUID } from "crypto";
import * as sharp from "sharp";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }

  async transform(
    images: Express.Multer.File,
    width: number,
    height: number,
    compressionRatio: number
  ): Promise<string> {
    const filename = "image" + "-" + randomUUID() + ".webp";

    const { width: imageWidth, height: imageHeight } = await sharp(
      images.buffer
    ).metadata();

    const resizeProps = { height: imageHeight, width: imageWidth };
    const compressionRatioProps = { quality: 100 };

    if (width) {
      resizeProps.width = width;
      resizeProps.height = Math.floor((imageHeight * width) / imageWidth);
    }

    if (height) {
      resizeProps.height = height;
      resizeProps.width = Math.floor((imageWidth * height) / imageHeight);
    }

    if (compressionRatio) {
      compressionRatioProps.quality = compressionRatio;
    }

    const outputPath = join("uploads", filename);

    await sharp(images.buffer)
      .resize(resizeProps)
      .webp({ ...compressionRatioProps, effort: 6 })
      .toFile(outputPath);

    return outputPath;
  }
}
