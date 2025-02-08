import { FactoryProvider, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

const config = new ConfigService();
const logger = new Logger("MinioFactory");

export const MINIO_CLIENT = Symbol("MINIO_CLIENT");

export const MinioClientFactory: FactoryProvider<Minio.Client> = {
  provide: MINIO_CLIENT,
  useFactory: async () => {
    try {
      const bucketName = config.getOrThrow<string>("S3_BUCKET");

      const minioClient = new Minio.Client({
        endPoint: config.getOrThrow<string>("S3_ENDPOINT"),
        port: +config.getOrThrow<number>("S3_API_PORT"),
        useSSL: false,
        accessKey: config.getOrThrow<string>("MINIO_ROOT_USER"),
        secretKey: config.getOrThrow<string>("MINIO_ROOT_PASSWORD"),
      });
      logger.verbose("MINIO Client started successfully");

      const isBucketExists = await minioClient.bucketExists(bucketName);

      if (!isBucketExists) {
        await minioClient.makeBucket(bucketName);
        logger.verbose(
          `Initial bucket "${bucketName}" has been successfully created`,
        );
      }

      return minioClient;
    } catch (e) {
      logger.error("An error occured in MINIO client", e);
      logger.error(e);
    }
  },
  inject: [ConfigService],
};
