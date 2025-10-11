import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { VideoService, GenerateVideoRequest, GenerateVideoResponse } from './video.service';

export class GenerateVideoDto {
  imageBase64: string;
  prompt: string;
  duration?: "5" | "10";
}

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateVideo(@Body() generateVideoDto: GenerateVideoDto): Promise<GenerateVideoResponse> {
    return this.videoService.generateVideo(generateVideoDto);
  }
}
