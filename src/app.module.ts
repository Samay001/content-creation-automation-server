import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {EmailApprovalModule} from './email/email.module';
import {ImageModule} from './image/image.module';
import {VideoModule} from './video/video.module';
import {WorkflowModule} from './workflow/workflow.module';
import {InstagramModule} from './instagram/instagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath: '.env', 
      cache: true, 
    }),
    EmailApprovalModule,
    ImageModule,
    VideoModule,
    WorkflowModule,
    InstagramModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}