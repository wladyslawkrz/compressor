import { Injectable, Logger } from "@nestjs/common";
import { join } from "path";
import { randomUUID } from "crypto";
import * as sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import * as ffmpeg from "fluent-ffmpeg";
import { StorageService } from "src/storage/storage.service";
import { BufferedFile } from "src/types";

@Injectable()
export class CompressService {
  private readonly compressorLogger = new Logger("Compressor");

  constructor(private readonly storage: StorageService) {}

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

  async compressGif(gif: Express.Multer.File, compressionRatio: number) {
    const filename = "animated" + "-" + randomUUID() + ".webp";
    const outputPath = join("uploads", filename);
    const compressionRatioProps = { quality: 100 };

    if (compressionRatio) {
      compressionRatioProps.quality = compressionRatio;
    }

    await sharp(gif.buffer, { animated: true })
      .webp({ ...compressionRatioProps, effort: 6 })
      .toFile(outputPath);

    return outputPath;
  }

  async compressVideoAndSaveToS3(
    video: Express.Multer.File,
    noSound: boolean,
    width: number,
    height: number
  ) {
    const inputDirectoryPath = path.join("temp", "input");
    if (!fs.existsSync(inputDirectoryPath)) {
      fs.mkdirSync(inputDirectoryPath, { recursive: true });
    }

    const filename = randomUUID() + path.extname(video.originalname);
    const inputFileTempPath = path.join(inputDirectoryPath, filename);
    fs.writeFile(inputFileTempPath, video.buffer, (err) => {
      if (err) {
        this.compressorLogger.error(err);
      } else {
        this.compressorLogger.verbose(`File saved to ${inputFileTempPath}`);
      }
    });

    const pathToCompressedVideo = await this.compressVideo(
      inputFileTempPath,
      noSound,
      width,
      height
    );
    const videoBuffer = fs.readFileSync(pathToCompressedVideo);
    const fileWithMetadata: BufferedFile = {
      buffer: videoBuffer,
      originalname: pathToCompressedVideo.split("/").pop(),
      fieldname: video.fieldname,
      mimetype: "video/webm",
      size: videoBuffer.length,
    };

    const s3publicLink =
      await this.storage.saveVideoToS3Storage(fileWithMetadata);

    await this.removeTempFile(inputFileTempPath);
    await this.removeTempFile(pathToCompressedVideo);

    return s3publicLink;
  }

  async compressVideo(
    pathToFile: string,
    noSound: boolean,
    width: number,
    height: number
  ) {
    const outputDirectoryPath = path.join("temp", "output");
    if (!fs.existsSync(outputDirectoryPath)) {
      fs.mkdirSync(outputDirectoryPath, { recursive: true });
    }
    const outputFilename = randomUUID() + ".webm";
    const outputFilePath = path.join(outputDirectoryPath, outputFilename);

    return new Promise<string>((resolve, reject) => {
      let command = ffmpeg(pathToFile)
        .outputOptions(["-c:v libvpx-vp9", "-crf 40", "-b:v 0"])
        .toFormat("webm");

      if (noSound) {
        command = command.noAudio();
      }

      if (width && !height) {
        console.log("+width -height");
        command = command.size(`${width}x?`);
      }

      if (height && !width) {
        console.log("-width +height");
        command = command.size(`?x${height}`);
      }

      if (width && height) {
        console.log("+width +height");
        command = command.size(`${width}x${height}`);
      }

      command
        .on("end", () => resolve(outputFilePath))
        .on("error", (err) => reject(err.message))
        .save(outputFilePath);
    });
  }

  async removeTempFile(path: string) {
    fs.unlink(path, (err) => {
      if (err) {
        this.compressorLogger.error(
          `Failed to delete input file: ${err.message}`
        );
      } else {
        this.compressorLogger.verbose(`Input file deleted: ${path}`);
      }
    });
  }
}
