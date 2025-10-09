import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const API_KEY = "AIzaSyDNpkVxSOvWSKKTu7KtLmMD2_xnLH87bO8";
console.log('🔑 Gemini API Key loaded:', API_KEY ? 'Yes' : 'No');

const CUSTOM_PROMPT = "Cinematic camera work on this scene: [Briefly describe the image content, e.g., 'a busy street scene at night' or 'a peaceful forest landscape']. Execute a fluid, slow-motion dolly zoom and sweeping arc motion. Key focus on dynamic animation and micro-movements: ensure all visible humans/objects are in motion (e.g., people walking, leaves rustling, cars passing). Add subtle atmospheric effects like gentle fog, lens flare, or light particles. Maintain a high-quality, hyper-realistic 4K film aesthetic.";

/**
 * Resolves file paths including home directory (~/) and relative paths
 */
function resolvePath(filePath: string): string {
  if (!filePath) {
    throw new Error('File path is required');
  }

  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  
  if (!path.isAbsolute(filePath)) {
    return path.join(process.cwd(), filePath);
  }
  
  return filePath;
}

/**
 * Converts image file to base64 format for Gemini API
 */
function imageToBase64(imagePath: string): { inlineData: { data: string; mimeType: string } } {
  try {
    const resolvedPath = resolvePath(imagePath);
    
    console.log('📂 Reading image from:', resolvedPath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Image file not found: ${resolvedPath}`);
    }

    const imageBuffer = fs.readFileSync(resolvedPath);
    const base64String = imageBuffer.toString('base64');
    
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType: string;
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }
    
    console.log('✅ Image converted to base64, MIME type:', mimeType);
    
    return {
      inlineData: {
        data: base64String,
        mimeType: mimeType,
      },
    };
  } catch (error) {
    console.error('❌ Error reading image file:', error);
    throw new Error(`Error reading image file: ${error.message}`);
  }
}

/**
 * Generates a cinematic video prompt from an image using Gemini API
 */
export async function generatePromptFromImage(
  imagePath: string,
  customPrompt: string = CUSTOM_PROMPT
): Promise<string> {
  console.log('🔍 Generating video prompt from image...');
  console.log(`📁 Image: ${imagePath}\n`);
  
  try {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const resolvedPath = resolvePath(imagePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Image file not found: ${resolvedPath}`);
    }
    
    const imagePart = imageToBase64(resolvedPath);
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: customPrompt },
            imagePart,
          ],
        },
      ],
    };
    
    console.log('🌐 Calling Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedPrompt = data.candidates[0].content.parts[0].text;
      console.log('📝 Generated Prompt Preview:', generatedPrompt.substring(0, 200) + '...');
      console.log('✅ Prompt generated successfully!\n');
      return generatedPrompt;
    } else {
      throw new Error('No content generated from the API');
    }
  } catch (error) {
    console.error('❌ Error in generatePromptFromImage:', error);
    throw new Error(`Failed to generate prompt: ${error.message}`);
  }
}

/**
 * Alternative: Generate prompt from buffer (useful when image is already in memory)
 */
export async function generatePromptFromBuffer(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
  customPrompt: string = CUSTOM_PROMPT
): Promise<string> {
  console.log('🔍 Generating video prompt from image buffer...');
  
  try {
    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const base64String = imageBuffer.toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64String,
        mimeType: mimeType,
      },
    };
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: customPrompt },
            imagePart,
          ],
        },
      ],
    };
    
    console.log('🌐 Calling Gemini API...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedPrompt = data.candidates[0].content.parts[0].text;
      console.log('📝 Generated Prompt Preview:', generatedPrompt.substring(0, 200) + '...');
      console.log('✅ Prompt generated successfully!\n');
      return generatedPrompt;
    } else {
      throw new Error('No content generated from the API');
    }
  } catch (error) {
    console.error('❌ Error in generatePromptFromBuffer:', error);
    throw new Error(`Failed to generate prompt: ${error.message}`);
  }
}