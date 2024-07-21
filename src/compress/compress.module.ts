import { Module } from "@nestjs/common";

import { CompressController } from "./comporess.controller";
import { CompressService } from "./compress.service";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [CompressController],
  providers: [CompressService],
})
export class CompressModule {}
