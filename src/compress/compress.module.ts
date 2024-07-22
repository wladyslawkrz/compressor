import { Module } from "@nestjs/common";

import { CompressController } from "./compress.controller";
import { CompressService } from "./compress.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [CompressController],
  providers: [CompressService],
})
export class CompressModule {}
