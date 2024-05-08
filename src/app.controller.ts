import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiQuery,
} from "@nestjs/swagger";

import { AppService } from "./app.service";
import { Response } from "express";
import { join } from "path";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return "hello world";
  }

  @Post("transform-webp")
  @ApiOperation({ summary: "Upload an image to transform" })
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
  @UseInterceptors(FileInterceptor("image"))
  async uploadImage(
    @Query("width") width: string,
    @Query("height") height: string,
    @Query("compressionRatio") compressionRatio: string,
    @UploadedFile() image: Express.Multer.File,
    @Res() res: Response
  ) {
    const filePath = await this.appService.transform(
      image,
      Number(width),
      Number(height),
      Number(compressionRatio)
    );
    const absolutePath = join(__dirname, "..", filePath);
    res.sendFile(absolutePath);
  }
}
