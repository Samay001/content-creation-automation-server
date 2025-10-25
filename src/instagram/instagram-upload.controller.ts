import { Controller, Get, Post, Body, Query, Logger } from '@nestjs/common';
import { InstagramUploadService } from './instagram-upload.service';

export class CreateInstagramContainerDto {
  videoUrl: string;
  caption: string;
}

@Controller('instagram')
export class InstagramUploadController {
  private readonly logger = new Logger(InstagramUploadController.name);

  constructor(
    private readonly instagramUploadService: InstagramUploadService
  ) {}

  /**
   * Manually trigger Instagram container creation
   * POST /instagram/create-container
   */
  @Post('create-container')
  async createContainer(@Body() createContainerDto: CreateInstagramContainerDto) {
    this.logger.log(`📱 Manual Instagram container creation requested`);
    this.logger.log(`🎬 Video URL: ${createContainerDto.videoUrl}`);
    this.logger.log(`📝 Caption: ${createContainerDto.caption.substring(0, 100)}...`);
    
    const result = await this.instagramUploadService.createInstagramContainer(
      createContainerDto.videoUrl,
      createContainerDto.caption
    );
    
    return {
      ...result,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get status of a specific container
   * GET /instagram/container-status?containerId=123
   */
  @Get('container-status')
  async getContainerStatus(@Query('containerId') containerId: string) {
    if (!containerId) {
      return {
        error: 'Container ID is required',
        message: 'Please provide containerId query parameter'
      };
    }

    const status = this.instagramUploadService.getContainerStatus(containerId);
    
    if (!status) {
      return {
        containerId,
        found: false,
        message: 'Container not found'
      };
    }

    return {
      containerId,
      found: true,
      ...status,
      timeElapsed: Date.now() - status.createdAt.getTime()
    };
  }

  /**
   * Get all containers and their statuses
   * GET /instagram/all-containers
   */
  @Get('all-containers')
  async getAllContainers() {
    const containers = this.instagramUploadService.getAllContainers();
    
    return {
      containers: containers.map(container => ({
        ...container,
        timeElapsed: Date.now() - container.createdAt.getTime()
      })),
      count: containers.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check endpoint to verify Instagram credentials
   * GET /instagram/health-check
   */
  @Get('health-check')
  async healthCheck() {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramId = process.env.INSTAGRAM_ACCOUNT_ID;

    const hasCredentials = !!(accessToken && instagramId);
    
    return {
      healthy: hasCredentials,
      hasAccessToken: !!accessToken,
      hasInstagramId: !!instagramId,
      accessTokenLength: accessToken?.length || 0,
      instagramId: instagramId ? `${instagramId.substring(0, 5)}...` : null,
      message: hasCredentials 
        ? 'Instagram credentials are configured' 
        : 'Instagram credentials are missing from environment variables',
      requiredEnvVars: [
        'INSTAGRAM_ACCESS_TOKEN',
        'INSTAGRAM_ACCOUNT_ID'
      ],
      timestamp: new Date().toISOString()
    };
  }
}