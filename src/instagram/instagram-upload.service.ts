import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ContainerInfo {
  containerId: string;
  videoUrl: string;
  caption: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'ready' | 'published' | 'failed';
}

@Injectable()
export class InstagramUploadService {
  private readonly logger = new Logger(InstagramUploadService.name);
  private containers: Map<string, ContainerInfo> = new Map();

  /**
   * Step 1: Create Instagram media container when email is approved
   */
  async createInstagramContainer(videoUrl: string, caption: string): Promise<{ success: boolean; containerId?: string; message: string }> {
    try {
      this.logger.log('🎬 Creating Instagram media container...');
      
      // Get environment variables
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const instagramId = process.env.INSTAGRAM_ACCOUNT_ID;

      if (!accessToken) {
        throw new Error('INSTAGRAM_ACCESS_TOKEN environment variable is not set');
      }

      if (!instagramId) {
        throw new Error('INSTAGRAM_ACCOUNT_ID environment variable is not set');
      }

      // Create the container using Facebook Graph API
      const url = `https://graph.facebook.com/v20.0/${instagramId}/media`;
      
      const params = new URLSearchParams();
      params.append('media_type', 'REELS');
      params.append('video_url', videoUrl);
      params.append('caption', caption);
      params.append('access_token', accessToken);

      this.logger.log(`📡 Creating container for video: ${videoUrl}`);
      this.logger.log(`📝 Caption: ${caption.substring(0, 100)}...`);
      
      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 60000,
      });

      const containerId = response.data?.id;
      if (!containerId) {
        throw new Error('No container ID returned from Facebook API');
      }

      // Store container info
      const containerInfo: ContainerInfo = {
        containerId,
        videoUrl,
        caption,
        createdAt: new Date(),
        status: 'processing'
      };
      
      this.containers.set(containerId, containerInfo);
      
      this.logger.log(`✅ Container created successfully: ${containerId}`);
      this.logger.log('⏳ Container will be published automatically in 1 minute...');
      
      // Schedule publishing after 1 minute
      this.scheduleContainerPublishing(containerId);
      
      return {
        success: true,
        containerId,
        message: 'Instagram container created successfully. Will be published in 1 minute.'
      };

    } catch (error) {
      this.logger.error('❌ Failed to create Instagram container:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorType = error.response?.data?.error?.type || 'Unknown';
        const errorCode = error.response?.data?.error?.code || 'N/A';
        
        return {
          success: false,
          message: `Instagram API error: ${errorMessage} (Type: ${errorType}, Code: ${errorCode})`
        };
      }
      
      return {
        success: false,
        message: `Failed to create Instagram container: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Step 2: Schedule the publishing of container after 1 minute
   */
  private scheduleContainerPublishing(containerId: string): void {
    setTimeout(async () => {
      await this.publishContainer(containerId);
    }, 60000); // 1 minute = 60,000 milliseconds
  }

  /**
   * Step 3: Publish the container to Instagram
   */
  private async publishContainer(containerId: string): Promise<void> {
    try {
      const containerInfo = this.containers.get(containerId);
      if (!containerInfo) {
        this.logger.error(`❌ Container ${containerId} not found in storage`);
        return;
      }

      this.logger.log(`🚀 Publishing Instagram container: ${containerId}`);
      
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const instagramId = process.env.INSTAGRAM_ACCOUNT_ID;

      if (!accessToken || !instagramId) {
        throw new Error('Instagram credentials not available in environment');
      }

      // Publish the container
      const url = `https://graph.facebook.com/v20.0/${instagramId}/media_publish`;
      
      const params = new URLSearchParams();
      params.append('creation_id', containerId);
      params.append('access_token', accessToken);

      const response = await axios.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 60000,
      });

      const mediaId = response.data?.id;
      if (!mediaId) {
        throw new Error('No media ID returned from publish API');
      }

      // Update container status
      containerInfo.status = 'published';
      this.containers.set(containerId, containerInfo);
      
      this.logger.log(`✅ Instagram reel published successfully!`);
      this.logger.log(`📱 Media ID: ${mediaId}`);
      this.logger.log(`🎬 Video: ${containerInfo.videoUrl}`);
      this.logger.log(`📝 Caption: ${containerInfo.caption}`);

    } catch (error) {
      this.logger.error(`❌ Failed to publish container ${containerId}:`, error);
      
      // Update container status to failed
      const containerInfo = this.containers.get(containerId);
      if (containerInfo) {
        containerInfo.status = 'failed';
        this.containers.set(containerId, containerInfo);
      }

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Instagram publish error: ${errorMessage}`);
      }
    }
  }

  /**
   * Get container status for monitoring
   */
  getContainerStatus(containerId: string): ContainerInfo | null {
    return this.containers.get(containerId) || null;
  }

  /**
   * Get all containers
   */
  getAllContainers(): ContainerInfo[] {
    return Array.from(this.containers.values());
  }
}