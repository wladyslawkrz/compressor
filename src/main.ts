import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const docsConfig = new DocumentBuilder()
    .setTitle("webp compressor")
    .setDescription("Simple webp compressor")
    .setVersion("v1.0")
    .build();

  const document = SwaggerModule.createDocument(app, docsConfig);

  SwaggerModule.setup("api", app, document);
  await app.listen(3009);
}
bootstrap();
