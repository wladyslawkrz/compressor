import { Module } from "@nestjs/common";

import { MinioClientFactory } from "./minio.factory";
import { StorageService } from "./storage.service";
import { StorageController } from "./storage.controller";

@Module({
  providers: [MinioClientFactory, StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
