import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CronService } from './cron.service';

export class TriggerWorkflowDto {
  imageUrl?: string;
}

export class UpdateImagesDto {
  imageUrls: string[];
}

export class AddImageDto {
  imageUrl: string;
}

@Controller('workflow-trigger')
export class CronController {
  constructor(private readonly cronService: CronService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerWorkflowNow(@Body() triggerDto: TriggerWorkflowDto) {
    await this.cronService.triggerWorkflowNow(triggerDto.imageUrl);
    return { 
      message: 'Workflow triggered successfully',
      triggeredAt: new Date().toISOString()
    };
  }

  @Get('images')
  getDefaultImages() {
    return {
      images: this.cronService.getDefaultImages(),
      count: this.cronService.getDefaultImages().length
    };
  }

  @Post('images')
  @HttpCode(HttpStatus.OK)
  updateDefaultImages(@Body() updateDto: UpdateImagesDto) {
    this.cronService.updateDefaultImages(updateDto.imageUrls);
    return { 
      message: 'Default images updated successfully',
      count: updateDto.imageUrls.length
    };
  }

  @Post('images/add')
  @HttpCode(HttpStatus.OK)
  addDefaultImage(@Body() addDto: AddImageDto) {
    this.cronService.addDefaultImage(addDto.imageUrl);
    return { 
      message: 'Image added to default list',
      imageUrl: addDto.imageUrl
    };
  }
}