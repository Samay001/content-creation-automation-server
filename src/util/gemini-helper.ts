import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Lazy loading for API key
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

const SIMPLE_DYNAMIC_PROMPT = "Create a dynamic video from this image. Add natural movement and life to the scene: gentle camera motion, moving elements like leaves, water, clouds, or people. Keep it smooth and realistic. Focus on bringing the static image to life with subtle animations and flowing movements.";

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
 * Generates a simple dynamic video prompt from an image using Gemini API
 */
export async function generatePromptFromImage(
  imagePath: string,
  customPrompt: string = SIMPLE_DYNAMIC_PROMPT
): Promise<string> {
  console.log('🔍 Generating video prompt from image...');
  console.log(`📁 Image: ${imagePath}\n`);
  
  try {
    const API_KEY = getGeminiApiKey();

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
  customPrompt: string = SIMPLE_DYNAMIC_PROMPT
): Promise<string> {
  console.log('🔍 Generating video prompt from image buffer...');
  
  try {
    const API_KEY = getGeminiApiKey();

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


