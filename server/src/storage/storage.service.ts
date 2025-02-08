import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

import { MINIO_CLIENT } from "./minio.factory";
import { BufferedFile } from "src/types";

@Injectable()
export class StorageService {
  logger: Logger = new Logger("MinioService");

  constructor(
    @Inject(MINIO_CLIENT) private readonly minioClient: Minio.Client,
    private readonly config: ConfigService,
  ) {}
  async createS3StorageBucket(bucketName: string) {
    const isBucketExists = await this.minioClient.bucketExists(bucketName);
    if (isBucketExists) {
      throw new ConflictException("Bucket already exists");
    }
    await this.minioClient.makeBucket(bucketName);
  }

  async saveVideoToS3Storage(buffer: BufferedFile) {
    const s3bucket = this.config.getOrThrow<string>("S3_BUCKET");
    const metaDataForFile = {
      "Content-Type": buffer.mimetype,
    };

    await this.minioClient.putObject(
      s3bucket,
      buffer.originalname,
      buffer.buffer,
      buffer.size,
      metaDataForFile,
    );

    const presignedUrl = await this.minioClient.presignedGetObject(
      s3bucket,
      buffer.originalname,
      24 * 60 * 60,
    );

    const s3publicUrl = this.config.getOrThrow<string>("S3_PUBLIC_URL");
    const uploadUrl = presignedUrl.replace(
      "http://localhost:9000/",
      s3publicUrl,
    );
    return presignedUrl;
  }

  async getS3StorageBucketList() {
    const bucketList = await this.minioClient.listBuckets();
    if (!bucketList) {
      throw new NotFoundException("MINIO instance have no any buckets");
    }

    return bucketList;
  }
}
