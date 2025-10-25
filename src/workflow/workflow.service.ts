import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageService } from '../image/image.service';
import { VideoService } from '../video/video.service';
import { EmailApprovalService } from '../email/email.service';
import { InstagramUploadService } from '../instagram/instagram-upload.service';

// Hardcoded video prompt - no need to generate this anymore
const HARDCODED_VIDEO_PROMPT = "Create a dynamic video from this image. Add natural movement and life to the scene: gentle camera motion, moving elements like leaves, water, clouds, or people if present. Keep it smooth and realistic. Focus on bringing the static image to life with subtle animations and flowing movements. Dont add anything not present in the image. The main aim of the video is to make the image dynamic by motion.";

export interface WorkflowConfig {
  imageUrl: string;
  recipientEmail?: string;
  videoDuration?: "5" | "10";
  autoPublishToInstagram?: boolean; // New option to enable auto Instagram publishing
}

export interface WorkflowResult {
  success: boolean;
  steps: {
    imageConversion: { success: boolean; data?: any; error?: string };
    promptGeneration: { success: boolean; data?: any; error?: string };
    captionGeneration: { success: boolean; data?: any; error?: string };
    videoGeneration: { success: boolean; data?: any; error?: string };
    emailSending: { success: boolean; data?: any; error?: string };
    instagramUpload?: { success: boolean; data?: any; error?: string };
  };
  finalOutput?: {
    convertedImage: string;
    prompt: string;
    caption: string;
    hashtags: string[];
    videoUrl: string;
    emailSent: boolean;
    instagramContainerId?: string;
    instagramPublished?: boolean;
  };
  executionTime: number;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly imageService: ImageService,
    private readonly videoService: VideoService,
    private readonly emailService: EmailApprovalService,
    private readonly instagramUploadService: InstagramUploadService,
  ) {}

  async executeCompleteWorkflow(config: WorkflowConfig): Promise<WorkflowResult> {
    const startTime = Date.now();
    this.logger.log('🚀 Starting complete content creation workflow...');
    
    const result: WorkflowResult = {
      success: false,
      steps: {
        imageConversion: { success: false },
        promptGeneration: { success: false },
        captionGeneration: { success: false },
        videoGeneration: { success: false },
        emailSending: { success: false },
        instagramUpload: { success: false },
      },
      executionTime: 0,
    };

    try {
      // Step 1: Convert image to 9:16 aspect ratio
      this.logger.log('📐 Step 1: Converting image aspect ratio...');
      try {
        const convertedImageBase64 = await this.imageService.convertImageToAspectRatio(config.imageUrl);
        result.steps.imageConversion = { 
          success: true, 
          data: { convertedImage: convertedImageBase64 } 
        };
        this.logger.log('✅ Step 1 completed: Image converted to 9:16 ratio');
      } catch (error) {
        result.steps.imageConversion = { success: false, error: error.message };
        this.logger.error('❌ Step 1 failed:', error.message);
        throw error;
      }

      // Step 2: Use hardcoded prompt (no generation needed)
      this.logger.log('🧠 Step 2: Using hardcoded video prompt...');
      try {
        result.steps.promptGeneration = { 
          success: true, 
          data: { prompt: HARDCODED_VIDEO_PROMPT }
        };
        this.logger.log('✅ Step 2 completed: Using predefined prompt');
      } catch (error) {
        result.steps.promptGeneration = { success: false, error: error.message };
        this.logger.error('❌ Step 2 failed:', error.message);
        throw error;
      }

      // Step 3: Generate caption and hashtags directly from image URL
      this.logger.log('📝 Step 3: Generating caption and hashtags from image URL...');
      try {
        const captionResult = await this.imageService.generateCaptionFromImageUrl(
          config.imageUrl,
          {
            tone: 'casual',
            maxHashtags: 15,
            maxCaptionLength: 300,
            includeCallToAction: true,
            targetAudience: 'social media users'
          }
        );
        result.steps.captionGeneration = { 
          success: true, 
          data: captionResult 
        };
        this.logger.log('✅ Step 3 completed: Caption and hashtags generated from image');
      } catch (error) {
        result.steps.captionGeneration = { success: false, error: error.message };
        this.logger.error('❌ Step 3 failed:', error.message);
        throw error;
      }

      // Step 4: Generate video with hardcoded prompt
      this.logger.log('🎬 Step 4: Generating video with predefined prompt...');
      try {
        const videoResult = await this.videoService.generateVideo({
          imageBase64: result.steps.imageConversion.data.convertedImage,
          prompt: HARDCODED_VIDEO_PROMPT,
          duration: config.videoDuration || "5"
        });
        result.steps.videoGeneration = { 
          success: true, 
          data: videoResult 
        };
        this.logger.log('✅ Step 4 completed: Video generated');
      } catch (error) {
        result.steps.videoGeneration = { success: false, error: error.message };
        this.logger.error('❌ Step 4 failed:', error.message);
        throw error;
      }

      // Step 5: Send email with results
      this.logger.log('📧 Step 5: Sending email with video and content...');
      try {
        const recipientEmail = config.recipientEmail || this.configService.get<string>('MAIL_USER');
        
        if (!recipientEmail) {
          throw new Error('No recipient email provided and MAIL_USER not configured');
        }

        await this.emailService.sendContentDeliveryEmail(
          recipientEmail,
          result.steps.videoGeneration.data.videoUrl,
          result.steps.captionGeneration.data.caption,
          result.steps.captionGeneration.data.hashtags
        );
        
        result.steps.emailSending = { 
          success: true, 
          data: { emailSent: true, recipientEmail } 
        };
        this.logger.log('✅ Step 5 completed: Email sent successfully');
      } catch (error) {
        result.steps.emailSending = { success: false, error: error.message };
        this.logger.error('❌ Step 5 failed:', error.message);
        // Don't throw here - we still want to return the content even if email fails
      }

      // Step 6: Auto Instagram Upload (if enabled)
      if (config.autoPublishToInstagram) {
        this.logger.log('📱 Step 6: Auto-publishing to Instagram...');
        try {
          const fullCaption = `${result.steps.captionGeneration.data.caption}\n\n${result.steps.captionGeneration.data.hashtags.join(' ')}`;
          
          const instagramResult = await this.instagramUploadService.createInstagramContainer(
            result.steps.videoGeneration.data.videoUrl,
            fullCaption
          );

          result.steps.instagramUpload = {
            success: instagramResult.success,
            data: {
              containerId: instagramResult.containerId,
              message: instagramResult.message,
              scheduled: true,
              publishIn: '1 minute'
            }
          };

          if (instagramResult.success) {
            this.logger.log(`✅ Step 6 completed: Instagram container created (${instagramResult.containerId})`);
            this.logger.log('⏰ Content will be published automatically in 1 minute');
          } else {
            this.logger.error(`❌ Step 6 failed: ${instagramResult.message}`);
          }
        } catch (error) {
          result.steps.instagramUpload = { 
            success: false, 
            error: error.message 
          };
          this.logger.error('❌ Step 6 failed:', error.message);
          // Don't throw - continue with workflow completion
        }
      } else {
        this.logger.log('📱 Step 6: Instagram upload skipped (autoPublishToInstagram = false)');
        result.steps.instagramUpload = { 
          success: true, 
          data: { skipped: true, reason: 'autoPublishToInstagram disabled' } 
        };
      }

      // Set final output
      result.finalOutput = {
        convertedImage: result.steps.imageConversion.data.convertedImage,
        prompt: HARDCODED_VIDEO_PROMPT,
        caption: result.steps.captionGeneration.data.caption,
        hashtags: result.steps.captionGeneration.data.hashtags,
        videoUrl: result.steps.videoGeneration.data.videoUrl,
        emailSent: result.steps.emailSending.success,
        instagramContainerId: result.steps.instagramUpload?.data?.containerId,
        instagramPublished: result.steps.instagramUpload?.success && !result.steps.instagramUpload?.data?.skipped,
      };

      result.success = true;
      this.logger.log('🎉 Workflow completed successfully!');

    } catch (error) {
      this.logger.error('💥 Workflow failed:', error.message);
      result.success = false;
    } finally {
      result.executionTime = Date.now() - startTime;
      this.logger.log(`⏱️ Total execution time: ${result.executionTime}ms`);
    }

    return result;
  }

  /**
   * Handle email approval and automatically trigger Instagram upload
   * This is called when user clicks "approve" in the email
   */
  async handleEmailApprovalWithInstagram(
    videoUrl: string, 
    caption: string, 
    hashtags: string[]
  ): Promise<{ success: boolean; containerId?: string; message: string }> {
    try {
      this.logger.log('✅ Content approved via email - triggering Instagram upload...');
      
      // Combine caption and hashtags
      const fullCaption = hashtags && hashtags.length > 0 
        ? `${caption}\n\n${hashtags.join(' ')}`
        : caption;
      
      // Trigger Instagram upload
      const result = await this.instagramUploadService.createInstagramContainer(videoUrl, fullCaption);
      
      if (result.success) {
        this.logger.log(`🎉 Instagram upload initiated successfully!`);
        this.logger.log(`📱 Container ID: ${result.containerId}`);
        this.logger.log(`⏰ Will be published automatically in 1 minute`);
      } else {
        this.logger.error(`❌ Instagram upload failed: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error('❌ Error during email approval Instagram upload:', error);
      return {
        success: false,
        message: `Failed to upload to Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get Instagram upload status for a container
   */
  getInstagramContainerStatus(containerId: string) {
    return this.instagramUploadService.getContainerStatus(containerId);
  }

  /**
   * Get all Instagram containers and their statuses
   */
  getAllInstagramContainers() {
    return this.instagramUploadService.getAllContainers();
  }
}