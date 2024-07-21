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
      const bucketName = config.get<string>("S3_BUCKET");
      const isSslActive =
        config.get<string>("S3_USE_SSL") === "false" ? false : true;

      const minioClient = new Minio.Client({
        endPoint: config.get<string>("S3_ENDPOINT"),
        port: +config.get<number>("S3_API_PORT"),
        useSSL: isSslActive,
        accessKey: config.get<string>("MINIO_ACCESS_KEY"),
        secretKey: config.get<string>("MINIO_SECRET_KEY"),
      });
      logger.verbose("MINIO Client started successfully");

      const isBucketExists = await minioClient.bucketExists(bucketName);

      if (!isBucketExists) {
        await minioClient.makeBucket(bucketName);
        logger.verbose(
          `Initial bucket "${bucketName}" has been successfully created`
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
