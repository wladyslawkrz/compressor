import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { join } from "path";

import { AppService } from "./app.service";

@ApiTags("Compressor routes")
@ApiInternalServerErrorResponse({
  description:
    "An error occured while processing the image transform. Please check your input data for correctness or try again later.",
})
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
    const filePath = await this.appService.transform(
      image,
      Number(width),
      Number(height),
      Number(compressionRatio)
    );
    const absolutePath = join(__dirname, "..", filePath);
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
  @HttpCode(HttpStatus.OK)
  @Post("compress-animated")
  async compressGif(
    @UploadedFile() gif: Express.Multer.File,
    @Res() res: Response
  ) {
    const filePath = await this.appService.compressGif(gif);
    const absolutePath = join(__dirname, "..", filePath);
    res.sendFile(absolutePath);
  }
}
