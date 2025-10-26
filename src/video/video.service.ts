import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GenerateVideoRequest {
  imageBase64: string;
  prompt: string;
  duration?: "5" | "10";
}

export interface AdvancedGenerateVideoRequest extends GenerateVideoRequest {
  webhookUrl?: string;
  imageTail?: string;
  negativePrompt?: string;
  cfgScale?: number;
  staticMask?: string;
  dynamicMasks?: Array<{
    mask: string;
    trajectories: Array<{
      x: number;
      y: number;
    }>;
  }>;
}

interface FreepikVideoRequest {
  webhook_url: string;
  image: string;
  image_tail?: string;
  prompt: string;
  negative_prompt?: string;
  duration: string;
  cfg_scale: number;
  static_mask?: string;
  dynamic_masks?: Array<{
    mask: string;
    trajectories: Array<{
      x: number;
      y: number;
    }>;
  }>;
}

export interface GenerateVideoResponse {
  videoUrl: string;
  taskId: string;
  result: any;
}

interface FreepikTaskResponse {
  data: {
    task_id: string;
    status: string;
    generated: string[];
  };
}

@Injectable()
export class VideoService {
  private readonly freepikApiKey: string;
  private readonly freepikBaseUrl = 'https://api.freepik.com/v1/ai/image-to-video/kling-v2-1-pro';

  constructor(private configService: ConfigService) {
    this.freepikApiKey = this.configService.get<string>('FREEPIK_API_KEY');
    if (!this.freepikApiKey) {
      throw new Error('FREEPIK_API_KEY environment variable is required');
    }
  }



  private async createVideoTask(
    imageBase64: string, 
    prompt: string, 
    duration: string,
    options?: Partial<AdvancedGenerateVideoRequest>
  ): Promise<string> {
    try {
      if (!imageBase64) {
        throw new BadRequestException('Image base64 data is required');
      }

      // Remove data URL prefix if present (data:image/jpeg;base64,)
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      if (!base64Data) {
        throw new BadRequestException('Invalid base64 image data');
      }

      console.log('📤 Creating video generation task with Freepik API...');
      
      // Prepare the complete request body as per the cURL specification
      const requestBody: FreepikVideoRequest = {
        webhook_url: options?.webhookUrl || "https://www.example.com/webhook",
        image: base64Data,
        image_tail: options?.imageTail, // Optional field - can be set to undefined/null
        prompt: prompt,
        negative_prompt: options?.negativePrompt, // Optional field - can be set to undefined/null
        duration: duration,
        cfg_scale: options?.cfgScale ?? 0.5, // Default value from cURL, use nullish coalescing to allow 0
        static_mask: options?.staticMask, // Optional field - can be set to undefined/null
        dynamic_masks: options?.dynamicMasks // Optional field - can be set to undefined/null
      };

      // Remove undefined fields to clean up the request
      const cleanedRequestBody = Object.fromEntries(
        Object.entries(requestBody).filter(([_, value]) => value !== undefined)
      );

      console.log('📋 Request body fields:', Object.keys(cleanedRequestBody).join(', '));
      if (options?.negativePrompt) console.log('🚫 Using negative prompt:', options.negativePrompt);
      if (options?.cfgScale !== undefined) console.log('⚙️  CFG Scale:', options.cfgScale);
      
      const response = await axios.post(
        this.freepikBaseUrl,
        cleanedRequestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-freepik-api-key': this.freepikApiKey
          }
        }
      );

      if (!response.data?.data?.task_id) {
        throw new InternalServerErrorException('Invalid response from Freepik API');
      }

      console.log(`✅ Video task created successfully with ID: ${response.data.data.task_id}`);
      
      return response.data.data.task_id;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.response) {
        console.error('Freepik API error:', error.response.data);
        throw new InternalServerErrorException(`Freepik API error: ${error.response.data?.message || error.message}`);
      }
      throw new InternalServerErrorException(`Error creating video task: ${error.message}`);
    }
  }

  private async pollTaskStatus(taskId: string): Promise<string> {
    const maxAttempts = 15; // 5 minutes with 20-second intervals
    const pollInterval = 20000; // 20 seconds

    console.log(`🔄 Starting to poll task status for ID: ${taskId}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 Polling attempt ${attempt}/${maxAttempts}...`);
        
        const response = await axios.get<FreepikTaskResponse>(
          `https://api.freepik.com/v1/ai/image-to-video/kling-v2-1/${taskId}`,
          {
            headers: {
              'x-freepik-api-key': this.freepikApiKey
            }
          }
        );

        const status = response.data.data.status;
        console.log(`📊 Task status: ${status}`);

        if (status === 'COMPLETED' && response.data.data.generated.length > 0) {
          const videoUrl = response.data.data.generated[0];
          console.log(`✅ Video generation completed! URL: ${videoUrl}`);
          return videoUrl;
        }

        if (status === 'FAILED' || status === 'ERROR') {
          throw new InternalServerErrorException(`Video generation failed with status: ${status}`);
        }

        // Wait before next poll
        if (attempt < maxAttempts) {
          console.log(`⏳ Waiting ${pollInterval / 1000}s before next poll...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        if (error.response?.status === 404) {
          throw new InternalServerErrorException('Task not found');
        }
        if (error instanceof InternalServerErrorException) {
          throw error;
        }
        console.error(`❌ Error polling task status (attempt ${attempt}):`, error.message);
        
        if (attempt === maxAttempts) {
          throw new InternalServerErrorException(`Failed to get task status after ${maxAttempts} attempts`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new InternalServerErrorException('Video generation timed out after 2 minutes');
  }

  async generateVideo({ imageBase64, prompt, duration = "5", ...options }: AdvancedGenerateVideoRequest): Promise<GenerateVideoResponse> {
    try {
      console.log('🎬 Starting video generation with Freepik API...');
      
      if (!imageBase64 || !prompt) {
        throw new BadRequestException('imageBase64 and prompt are required');
      }
      
      console.log("⏱️  Duration:", duration, "seconds");
      console.log("🔄 Creating video generation task...\n");
      
      // Step 1: Create the video generation task with all options
      const taskId = await this.createVideoTask(imageBase64, prompt, duration, options);
      
      // Step 2: Poll for task completion with 2-minute timeout
      const videoUrl = await this.pollTaskStatus(taskId);
      
      console.log("\n✅ Video generation completed!");
      console.log("📹 Video URL:", videoUrl);
      
      return {
        videoUrl: videoUrl,
        taskId: taskId,
        result: {
          taskId: taskId,
          status: 'COMPLETED',
          videoUrl: videoUrl
        }
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error generating video: ${error.message}`);
    }
  }

  // Convenience method to maintain backward compatibility
  async generateSimpleVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    return this.generateVideo(request);
  }
}
