import { Body, Controller, Post } from '@nestjs/common';
import { ImageService } from './image.service';
import { CaptionOptions } from '../util/caption-helper';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('aspect-ratio')
  async convertAspectRatio(@Body('imageUrl') imageUrl: string) {
    const convertedImageBase64 = await this.imageService.convertImageToAspectRatio(imageUrl);
    return {
      message: 'Image converted successfully to 9:16 aspect ratio.',
      image: convertedImageBase64,
    };
  }

  @Post('generate-prompt')
  async generatePrompt(@Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      return { error: 'Image URL is required' };
    }
    return this.imageService.generatePrompt(imageUrl);
  }

  @Post('generate-caption')
  async generateCaption(@Body() body: { 
    imagePrompt: string; 
    options?: CaptionOptions 
  }) {
    const { imagePrompt, options } = body;
    
    if (!imagePrompt) {
      return { error: 'Image prompt is required' };
    }
    
    return this.imageService.generateCaption(imagePrompt, options);
  }
}