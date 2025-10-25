import { Controller, Post, Body, HttpCode, HttpStatus, Get, Query } from '@nestjs/common';
import { WorkflowService, WorkflowResult } from './workflow.service';

export class ExecuteWorkflowDto {
  imageUrl: string;
  recipientEmail?: string;
  videoDuration?: "5" | "10";
  autoPublishToInstagram?: boolean;
}

export class EmailApprovalDto {
  videoUrl: string;
  caption: string;
  hashtags?: string[];
}

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async executeWorkflow(@Body() workflowDto: ExecuteWorkflowDto): Promise<WorkflowResult> {
    return this.workflowService.executeCompleteWorkflow(workflowDto);
  }

  @Post('approve-with-instagram')
  @HttpCode(HttpStatus.OK)
  async handleEmailApproval(@Body() approvalDto: EmailApprovalDto) {
    return this.workflowService.handleEmailApprovalWithInstagram(
      approvalDto.videoUrl,
      approvalDto.caption,
      approvalDto.hashtags || []
    );
  }

  @Get('instagram-containers')
  async getInstagramContainers(@Query('containerId') containerId?: string) {
    if (containerId) {
      const status = this.workflowService.getInstagramContainerStatus(containerId);
      return {
        containerId,
        status: status || 'Container not found'
      };
    } else {
      const allContainers = this.workflowService.getAllInstagramContainers();
      return {
        containers: allContainers,
        count: allContainers.length
      };
    }
  }
}