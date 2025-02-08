import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["debug", "error", "verbose"],
  });
  const logger = new Logger("NestApplication");
  app.setGlobalPrefix("/v1");

  const config = app.get(ConfigService);
  const PORT = config.getOrThrow<number>("PORT") || 3010;

  const docsConfig = new DocumentBuilder()
    .setTitle("web compressor")
    .setDescription("Simple image and video compressor API")
    .setVersion("v1.0")
    .build();

  const document = SwaggerModule.createDocument(app, docsConfig);

  SwaggerModule.setup("api", app, document);

  await app.listen(PORT, () => {
    logger.debug(`Server is running on port ${PORT}`);
  });
}
bootstrap();
