import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { VideoService, GenerateVideoRequest, GenerateVideoResponse, AdvancedGenerateVideoRequest } from './video.service';

export class GenerateVideoDto {
  imageBase64: string;
  prompt: string;
  duration?: "5" | "10";
}

export class AdvancedGenerateVideoDto extends GenerateVideoDto {
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

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateVideo(@Body() generateVideoDto: GenerateVideoDto): Promise<GenerateVideoResponse> {
    return this.videoService.generateVideo(generateVideoDto);
  }

  @Post('generate/advanced')
  @HttpCode(HttpStatus.OK)
  async generateAdvancedVideo(@Body() generateVideoDto: AdvancedGenerateVideoDto): Promise<GenerateVideoResponse> {
    return this.videoService.generateVideo(generateVideoDto);
  }
}
