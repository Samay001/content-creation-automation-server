import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowService, WorkflowConfig } from './workflow.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private defaultImageUrls: string[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly workflowService: WorkflowService,
  ) {
    // Default image URLs for content creation
    // You can replace these with your own image URLs
    this.defaultImageUrls = [
      'https://drive.google.com/file/d/1hZA1fzLi9jxiB7w5D_Qe994WJ6tr4D_c/view?usp=drive_link',
    ];
    
    this.logger.log('🚀 Workflow service initialized (Cloud Run mode - no cron jobs)');
  }

  private getRandomImageUrl(): string {
    const randomIndex = Math.floor(Math.random() * this.defaultImageUrls.length);
    return this.defaultImageUrls[randomIndex];
  }

  // Manual trigger methods for testing
  async triggerWorkflowNow(imageUrl?: string): Promise<void> {
    this.logger.log('🔄 Manually triggering workflow...');
    
    const recipientEmail = this.configService.get<string>('MAIL_USER') || 
                         this.configService.get<string>('CRON_RECIPIENT_EMAIL');
    
    if (!recipientEmail) {
      throw new Error('No recipient email configured');
    }

    const finalImageUrl = imageUrl || this.getRandomImageUrl();
    this.logger.log(`📸 Using image: ${finalImageUrl}`);

    const workflowConfig: WorkflowConfig = {
      imageUrl: finalImageUrl,
      recipientEmail: recipientEmail,
      videoDuration: "5"
    };

    await this.workflowService.executeCompleteWorkflow(workflowConfig);
  }

  updateDefaultImages(imageUrls: string[]): void {
    this.defaultImageUrls = imageUrls;
    this.logger.log(`📸 Updated default image URLs (${imageUrls.length} images)`);
  }

  // Method to add a new image URL
  addDefaultImage(imageUrl: string): void {
    this.defaultImageUrls.push(imageUrl);
    this.logger.log(`📸 Added new default image: ${imageUrl}`);
  }

  // Method to get current image URLs
  getDefaultImages(): string[] {
    return [...this.defaultImageUrls];
  }
}