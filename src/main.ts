import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '10mb' })); 
  const PORT = process.env.PORT || 9000;
  await app.listen(PORT);

  console.log(`🚀 Content Creation Automation Server is running on: http://localhost:${PORT}`);
}
bootstrap();