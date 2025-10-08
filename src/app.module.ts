import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the config available globally
      envFilePath: '.env', // Path to the .env file
      cache: true, // Cache environment variables for better performance
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}