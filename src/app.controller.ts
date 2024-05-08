import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';

import { SharpPipe } from './sharp-pipe';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'hello world';
  }

  @Post('transform-webp')
  @ApiOperation({ summary: 'Upload an image to transform' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile(SharpPipe) image: string) {
    return `Uploaded file name: ${image}`;
  }
}
