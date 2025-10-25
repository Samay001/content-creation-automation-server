import { Module } from '@nestjs/common';
import { InstagramUploadService } from './instagram-upload.service';
import { InstagramUploadController } from './instagram-upload.controller';

@Module({
  controllers: [InstagramUploadController],
  providers: [InstagramUploadService],
  exports: [InstagramUploadService],
})
export class InstagramModule {}