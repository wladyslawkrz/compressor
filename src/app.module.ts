import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigModule } from "@nestjs/config";
import { memoryStorage } from "multer";

import { CompressModule } from "./compress/compress.module";
import { StorageModule } from "./storage/storage.module";

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CompressModule,
    StorageModule,
  ],
})
export class AppModule {}
