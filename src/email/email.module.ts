import { Module, forwardRef } from '@nestjs/common';
import { EmailApprovalController } from './email.controller';
import { EmailApprovalService } from './email.service';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [forwardRef(() => WorkflowModule)],
  controllers: [EmailApprovalController],
  providers: [EmailApprovalService],
  exports: [EmailApprovalService],
})
export class EmailApprovalModule {}
