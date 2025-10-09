import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { generatePromptFromImage } from '../util/gemini-helper';

@Injectable()
export class ImageService {
  private readonly tempDir = path.join(process.cwd(), 'temp');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Converts Google Drive sharing link to direct download link
   */
  private convertGoogleDriveUrl(url: string): string {
    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    return url;
  }

  /**
   * Validates if the URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const validProtocols = ['http:', 'https:'];
      return validProtocols.includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Downloads an image from a URL
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    try {
      const directUrl = this.convertGoogleDriveUrl(imageUrl);

      const response = await axios.get(directUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new BadRequestException(`Failed to download image from URL: ${error.message}`);
    }
  }

  /**
   * Converts an image to 9:16 aspect ratio and returns as base64
   */
  async convertImageToAspectRatio(
    imageUrl: string,
    targetRatio = { width: 9, height: 16 },
  ): Promise<string> {
    try {
      if (!imageUrl) {
        throw new BadRequestException('Image URL is required.');
      }

      if (!this.isValidImageUrl(imageUrl)) {
        throw new BadRequestException('Invalid image URL provided.');
      }

      console.log('📥 Downloading image from:', imageUrl);
      
      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new BadRequestException('Invalid image metadata.');
      }

      console.log(`📐 Original dimensions: ${width}x${height}`);

      const originalRatio = width / height;
      const desiredRatio = targetRatio.width / targetRatio.height;

      let targetWidth: number, targetHeight: number, offsetX = 0, offsetY = 0;

      if (originalRatio > desiredRatio) {
        // Image too wide, crop width
        targetHeight = height;
        targetWidth = Math.round(height * desiredRatio);
        offsetX = Math.round((width - targetWidth) / 2);
      } else {
        // Image too tall, crop height
        targetWidth = width;
        targetHeight = Math.round(width / desiredRatio);
        offsetY = Math.round((height - targetHeight) / 2);
      }

      console.log(`✂️ Cropping to: ${targetWidth}x${targetHeight} (offset: ${offsetX}, ${offsetY})`);

      // Process image
      const processedBuffer = await sharp(imageBuffer)
        .extract({ left: offsetX, top: offsetY, width: targetWidth, height: targetHeight })
        .jpeg({ quality: 90 })
        .toBuffer();

      console.log('✅ Image processed successfully');

      // Convert to base64 with data URI prefix
      const base64Image = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

      return base64Image;
    } catch (error) {
      console.error('❌ Error in convertImageToAspectRatio:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process image.');
    }
  }

  /**
   * Generates a prompt from an image URL using Gemini
   */
  async generatePrompt(imageUrl: string) {
    let tempFilePath: string | null = null;

    try {
      if (!imageUrl) {
        throw new BadRequestException('Image URL is required.');
      }

      if (!this.isValidImageUrl(imageUrl)) {
        throw new BadRequestException('Invalid image URL provided.');
      }

      // Download image
      console.log('Downloading image from:', imageUrl);
      const imageBuffer = await this.downloadImage(imageUrl);
      console.log('Image downloaded, buffer size:', imageBuffer.length);

      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Save to temporary file with absolute path
      const filename = `temp-${Date.now()}.jpg`;
      tempFilePath = path.resolve(this.tempDir, filename);
      console.log('Saving temp file to:', tempFilePath);
      
      fs.writeFileSync(tempFilePath, imageBuffer);
      
      // Verify file was created
      if (!fs.existsSync(tempFilePath)) {
        throw new Error('Failed to create temporary file');
      }
      console.log('Temp file created successfully');

      // Generate prompt using Gemini
      console.log('Calling generatePromptFromImage with path:', tempFilePath);
      const prompt = await generatePromptFromImage(tempFilePath);
      console.log('Prompt generated successfully');

      return { prompt };
    } catch (error) {
      console.error('Error in generatePrompt:', error);
      console.error('Error stack:', error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to generate prompt: ${error.message}`);
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log('Temp file cleaned up');
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
      }
    }
  }
}