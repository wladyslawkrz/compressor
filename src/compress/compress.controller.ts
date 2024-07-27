import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { join } from "path";

import { CompressService } from "./compress.service";
import { CompressionPreset } from "src/types";

@ApiTags("Compressor routes")
@ApiInternalServerErrorResponse({
  description:
    "An error occured while processing the image transform. Please check your input data for correctness or try again later.",
})
@Controller("compress")
export class CompressController {
  constructor(private readonly compress: CompressService) {}

  @Post("transform-webp")
  @ApiOperation({ summary: "Upload an image to transform" })
  @ApiOkResponse({ description: "The image was transformed successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiProduces("application/octet-stream")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiQuery({
    name: "width",
    description: "Width of the image in pixels (default: image width)",
    required: false,
  })
  @ApiQuery({
    name: "height",
    description: "Height of the image in pixels (default: image height)",
    required: false,
  })
  @ApiQuery({
    name: "compressionRatio",
    description:
      "Compression ratio of the image (0-100, higher is better, default: 100)",
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image"))
  async uploadImage(
    @Query("width") width: string,
    @Query("height") height: string,
    @Query("compressionRatio") compressionRatio: string,
    @UploadedFile() image: Express.Multer.File,
    @Res() res: Response
  ) {
    const filePath = await this.compress.transform(
      image,
      Number(width),
      Number(height),
      Number(compressionRatio)
    );
    const absolutePath = join(__dirname, "..", "..", filePath);
    res.sendFile(absolutePath);
  }

  @ApiOperation({ summary: "Upload an image to transform" })
  @ApiOkResponse({ description: "The image was transformed successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiProduces("application/octet-stream")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        image: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("image"))
  @ApiQuery({
    name: "compressionRatio",
    description:
      "Compression ratio of the image (0-100, higher is better, default: 100)",
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  @Post("compress-animated")
  async compressGif(
    @Query("compressionRatio") compressionRatio: string,
    @UploadedFile() gif: Express.Multer.File,
    @Res() res: Response
  ) {
    const filePath = await this.compress.compressGif(
      gif,
      Number(compressionRatio)
    );
    const absolutePath = join(__dirname, "..", "..", filePath);
    res.sendFile(absolutePath);
  }

  @Post("compress-video")
  @ApiOperation({ summary: "Upload a video to compress" })
  @ApiOkResponse({ description: "The video was compressed successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiProduces("application/octet-stream")
  @ApiBody({
    description: "Video to compress",
    required: true,
    schema: {
      type: "object",
      properties: {
        video: {
          type: "string",
          format: "binary",
          description: "Upload a video file",
        },
      },
    },
  })
  @ApiQuery({
    name: "width",
    description:
      "Set width of video frame in pixels (default: video frame width)",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "height",
    description:
      "Set height of video frame in pixels (default: video frame height)",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "noSound",
    description: "Remove sound from the video (default: false)",
    type: Boolean,
    required: false,
  })
  @UseInterceptors(FileInterceptor("video"))
  @ApiQuery({
    name: "preset",
    description:
      "Preset for the compression (default: WEBM, values: WEBM, MP4)",
    enum: CompressionPreset,
    required: false,
  })
  @ApiQuery({
    name: "crf",
    description:
      "Constant Rate Factor value (default: 23, values in range 0-51, lower value - better quality and big file size, higher value - lower quality and less size)",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "audioBitrate",
    description: "Audio track bitrate (measure - kilobites (k))",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "videoBitrate",
    description: "Video bitrate (measure - kilobites (k))",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "videoFramerate",
    description: "Video framerate (FPS), integer value",
    type: Number,
    required: false,
  })
  @HttpCode(HttpStatus.OK)
  async compressVideo(
    @UploadedFile() video: Express.Multer.File,
    @Query(
      "preset",
      new ParseEnumPipe(CompressionPreset, {
        optional: true,
      })
    )
    preset?: CompressionPreset,
    @Query("crf", new ParseIntPipe({ optional: true })) crf?: number,
    @Query("width", new ParseIntPipe({ optional: true })) width?: number,
    @Query("height", new ParseIntPipe({ optional: true })) height?: number,
    @Query("audioBitrate", new ParseIntPipe({ optional: true }))
    audioBitrate?: number,
    @Query("videoBitrate", new ParseIntPipe({ optional: true }))
    videoBitrate?: number,
    @Query("videoFramerate", new ParseIntPipe({ optional: true }))
    videoFramerate?: number,
    @Query("noSound", new ParseBoolPipe({ optional: true }))
    noSound?: boolean
  ) {
    if (!video) {
      throw new BadRequestException("No video file uploaded");
    }
    const url = await this.compress.compressVideoAndSaveToS3(
      video,
      noSound,
      width,
      height,
      preset,
      crf,
      audioBitrate,
      videoBitrate,
      videoFramerate
    );
    return { message: "Video successfully compressed", downloadUrl: url };
  }

  @Post("crop-video")
  @ApiOperation({ summary: "Crop a video" })
  @ApiOkResponse({ description: "The video was cropped successfully" })
  @ApiConsumes("multipart/form-data")
  @ApiProduces("application/octet-stream")
  @ApiBody({
    description: "Video to crop",
    required: true,
    schema: {
      type: "object",
      properties: {
        video: {
          type: "string",
          format: "binary",
          description: "Upload a video file",
        },
      },
    },
  })
  @ApiQuery({
    name: "width",
    description: "Width of the video frame in pixels",
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: "height",
    description: "Height of the video frame in pixels",
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: "x",
    description: "X coordinate of the top-left corner of the crop area",
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: "y",
    description: "Y coordinate of the top-left corner of the crop area",
    type: Number,
    required: false,
  })
  @UseInterceptors(FileInterceptor("video"))
  @HttpCode(HttpStatus.OK)
  async cropVideo(
    @UploadedFile() video: Express.Multer.File,
    @Query("width", new ParseIntPipe()) width: number,
    @Query("height", new ParseIntPipe()) height: number,
    @Query("x", new ParseIntPipe({ optional: true })) x: number,
    @Query("y", new ParseIntPipe({ optional: true })) y: number
  ) {
    if (!video) {
      throw new BadRequestException("No video file uploaded");
    }
    const url = await this.compress.cropVideoAndSaveToS3(
      video,
      width,
      height,
      x,
      y
    );
    return { message: "Video successfully cropped", downloadUrl: url };
  }
}
