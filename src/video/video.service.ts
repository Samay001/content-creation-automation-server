import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';

export interface GenerateVideoRequest {
  imageBase64: string;
  prompt: string;
  duration?: "5" | "10";
}

export interface GenerateVideoResponse {
  videoUrl: string;
  requestId: string;
  result: any;
}

@Injectable()
export class VideoService {
  constructor(private configService: ConfigService) {
    const falKey = this.configService.get<string>('FAL_KEY');
    if (!falKey) {
      throw new Error('FAL_KEY environment variable is required');
    }
    
    fal.config({
      credentials: falKey
    });
  }



  private async uploadImageFromBase64(imageBase64: string): Promise<string> {
    try {
      if (!imageBase64) {
        throw new BadRequestException('Image base64 data is required');
      }

      // Remove data URL prefix if present (data:image/jpeg;base64,)
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      if (fileBuffer.length === 0) {
        throw new BadRequestException('Invalid base64 image data');
      }

      // Detect image type from base64 header or default to jpeg
      let contentType = 'image/jpeg';
      let fileName = 'image.jpg';
      
      if (imageBase64.startsWith('data:image/')) {
        const mimeMatch = imageBase64.match(/data:image\/([a-z]+);base64,/);
        if (mimeMatch) {
          const imageType = mimeMatch[1];
          contentType = `image/${imageType}`;
          fileName = `image.${imageType === 'jpeg' ? 'jpg' : imageType}`;
        }
      }
      
      const file = new File([fileBuffer], fileName, { type: contentType });
      
      console.log(`📤 Uploading image from base64 data...`);
      const url = await fal.storage.upload(file);
      console.log(`✅ Image uploaded successfully\n`);
      
      return url;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error uploading image: ${error.message}`);
    }
  }

  async generateVideo({ imageBase64, prompt, duration = "5" }: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    try {
      console.log('🎬 Starting video generation...');
      
      if (!imageBase64 || !prompt) {
        throw new BadRequestException('imageBase64 and prompt are required');
      }
      
      const imageUrl = await this.uploadImageFromBase64(imageBase64);
      
      const input = {
        prompt: prompt,
        image_url: imageUrl,
        duration: duration,
        width: 1080,      // 9:16 ratio width
        height: 1920,     // 9:16 ratio height
        aspect_ratio: "9:16" // Explicitly set aspect ratio
      };
      
      console.log("⏱️  Duration:", duration, "seconds");
      console.log("🔄 Processing video generation...\n");
      
      const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
        input: input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          } else if (update.status === "IN_QUEUE") {
            console.log("⏳ Request is in queue");
          }
        },
      });
      
      console.log("\n✅ Video generation completed!");
      console.log("📹 Video URL:", result.data.video.url);
      
      return {
        videoUrl: result.data.video.url,
        requestId: result.requestId,
        result: result
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error generating video: ${error.message}`);
    }
  }
}
