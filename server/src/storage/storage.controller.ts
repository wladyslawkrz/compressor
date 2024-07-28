import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from "@nestjs/common";

import { StorageService } from "./storage.service";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

@ApiTags("S3 storage debugger")
@Controller("s3-debug")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({ summary: "Get list of buckets [test]" })
  @HttpCode(HttpStatus.OK)
  @Get("get-list-of-buckets")
  async getBucketList() {
    return this.storageService.getS3StorageBucketList();
  }

  @ApiOperation({ summary: "Create new bucket [test]" })
  @ApiQuery({ name: "bucketName", required: true, type: String })
  @HttpCode(HttpStatus.OK)
  @Post("test-create-new-bucket")
  async createBucket(@Query("bucketName") bucketName: string) {
    return this.storageService.createS3StorageBucket(bucketName);
  }
}
