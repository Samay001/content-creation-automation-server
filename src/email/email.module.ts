import { Module } from '@nestjs/common';
import { EmailApprovalController } from './email.controller';
import { EmailApprovalService } from './email.service';

@Module({
  controllers: [EmailApprovalController],
  providers: [EmailApprovalService],
})
export class EmailApprovalModule {}
