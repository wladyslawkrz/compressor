import { Module } from "@nestjs/common";

import { MinioClientFactory } from "./minio.factory";
import { StorageService } from "./storage.service";

@Module({
  providers: [MinioClientFactory, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
