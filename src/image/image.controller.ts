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

  @Post('generate-caption-from-url')
  async generateCaptionFromUrl(@Body() body: { 
    imageUrl: string; 
    options?: CaptionOptions 
  }) {
    const { imageUrl, options } = body;
    
    if (!imageUrl) {
      return { error: 'Image URL is required' };
    }
  
    return this.imageService.generateCaptionFromImageUrl(imageUrl, options);
  }
}