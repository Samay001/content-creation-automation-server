import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const PORT = process.env.PORT || 9000;
  await app.listen(PORT);

  console.log(`🚀 Content Creation Automation Server is running on: http://localhost:${PORT}`);
}
bootstrap();