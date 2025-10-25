import { Module, forwardRef } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { CronController } from './cron.controller';
import { CronService } from './cron.service';
import { ImageModule } from '../image/image.module';
import { VideoModule } from '../video/video.module';
import { EmailApprovalModule } from '../email/email.module';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [ImageModule, VideoModule, forwardRef(() => EmailApprovalModule), InstagramModule],
  controllers: [WorkflowController, CronController],
  providers: [WorkflowService, CronService],
  exports: [WorkflowService, CronService],
})
export class WorkflowModule {}