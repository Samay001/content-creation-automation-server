import OpenAI from 'openai';
import axios from 'axios';

/**
 * Extracts JSON content from markdown code blocks
 * Handles cases where AI responses are wrapped in ```json ... ```
 */
function extractJsonFromMarkdown(text: string): string {
  // Remove markdown code block syntax
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // If no code blocks found, return the original text (might already be clean JSON)
  return text.trim();
}

// Type definitions for better type safety
export interface CaptionOptions {
  maxHashtags?: number;
  tone?: 'casual' | 'professional' | 'funny' | 'inspirational' | 'trendy' | 'educational';
  maxCaptionLength?: number;
  targetAudience?: string;
  includeCallToAction?: boolean;
}

export interface InstagramContent {
  caption: string;
  hashtags: string[];
  fullContent: string; // Caption + hashtags combined
}

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY environment variable.');
    }
    
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('🔑 OpenAI client initialized successfully');
  }
  
  return openaiClient;
}

// Gemini API helper functions
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

/**
 * Converts Google Drive sharing link to direct download link
 */
function convertGoogleDriveUrl(url: string): string {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log(`🔗 Converting Google Drive URL: ${match[1]}`);
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  return url;
}

/**
 * Downloads an image from URL and converts it to base64 for Gemini API
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ inlineData: { data: string; mimeType: string } }> {
  try {
    // Convert Google Drive URLs to direct download links
    const directUrl = convertGoogleDriveUrl(imageUrl);
    console.log('📥 Downloading image from URL:', directUrl);
    
    const response = await axios.get(directUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const imageBuffer = Buffer.from(response.data);
    console.log(`📊 Downloaded image size: ${imageBuffer.length} bytes`);
    
    if (imageBuffer.length === 0) {
      throw new Error('Downloaded image is empty - this often happens with Google Drive sharing links that require permission');
    }
    
    const base64String = imageBuffer.toString('base64');
    
    // Determine MIME type from content-type header or URL extension
    let mimeType = response.headers['content-type'] || 'image/jpeg';
    console.log('📋 Response headers:', response.headers);
    
    if (!mimeType.startsWith('image/')) {
      // Fallback: determine from URL extension
      const urlLower = imageUrl.toLowerCase();
      if (urlLower.includes('.png')) mimeType = 'image/png';
      else if (urlLower.includes('.webp')) mimeType = 'image/webp';
      else if (urlLower.includes('.gif')) mimeType = 'image/gif';
      else mimeType = 'image/jpeg';
    }
    
    console.log('✅ Image downloaded and converted to base64, MIME type:', mimeType);
    console.log(`🔢 Base64 preview: ${base64String.substring(0, 50)}...`);
    
    return {
      inlineData: {
        data: base64String,
        mimeType: mimeType,
      },
    };
  } catch (error) {
    console.error('❌ Error downloading image:', error);
    throw new Error(`Error downloading image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


/**
 * Generates Instagram caption and hashtags directly from an image URL using Gemini Vision
 * @param imageUrl - URL of the image to analyze
 * @param options - Configuration options for caption generation
 * @returns Promise<InstagramContent> - Object containing caption, hashtags, and combined content
 */
export async function generateInstagramContentFromImage(
  imageUrl: string,
  options: CaptionOptions = {}
): Promise<InstagramContent> {
  const {
    maxHashtags = 15,
    tone = 'casual',
    maxCaptionLength = 300,
    targetAudience = 'social media users',
    includeCallToAction = true
  } = options;

  console.log('🎬 Generating Instagram content from image using Gemini Vision...');
  console.log(`📸 Image URL: ${imageUrl}`);
  
  try {
    const API_KEY = getGeminiApiKey();
    
    // Download and convert image to base64
    const imagePart = await imageUrlToBase64(imageUrl);
    
    const captionPrompt = `Analyze this image and create engaging Instagram content.

Requirements:
- Tone: ${tone}
- Target audience: ${targetAudience}
- Caption max length: ${maxCaptionLength} characters
- Include ${includeCallToAction ? 'a call-to-action' : 'no call-to-action'}
- Generate ${maxHashtags} relevant hashtags

Look at this image carefully and create:
1. An engaging caption that describes what you see and makes it appealing for social media
2. Relevant hashtags based on the visual content

Generate EXACTLY this JSON format:
{
  "caption": "[Write an engaging caption based on what you see in the image - describe the scene, mood, or activity in an appealing way for Instagram]",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", ...] 
}

Focus on:
- What you actually see in the image
- The mood and atmosphere
- Relevant activities or objects
- Popular Instagram hashtags for this type of content
- Engaging and authentic language`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: captionPrompt },
            imagePart,
          ],
        },
      ],
    };
    
    console.log('🌐 Calling Gemini Vision API...');
    
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
      const generatedContent = data.candidates[0].content.parts[0].text;
      console.log('📝 Generated Content Preview:', generatedContent.substring(0, 200) + '...');
      
      // Extract JSON from markdown code blocks if present
      const cleanedContent = extractJsonFromMarkdown(generatedContent);
      console.log('🧹 Cleaned Content:', cleanedContent.substring(0, 200) + '...');
      
      // Parse the JSON response from Gemini
      const parsed = JSON.parse(cleanedContent);
      
      // Validate and format the response
      if (!parsed.caption || !Array.isArray(parsed.hashtags)) {
        throw new Error('Invalid response format from Gemini');
      }

      // Ensure hashtags have # symbol and are properly formatted
      const formattedHashtags = parsed.hashtags
        .map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`)
        .slice(0, maxHashtags);

      const result: InstagramContent = {
        caption: parsed.caption.trim(),
        hashtags: formattedHashtags,
        fullContent: `${parsed.caption.trim()}\n\n${formattedHashtags.join(' ')}`
      };
      
      console.log('✅ Instagram content generated successfully with Gemini Vision!');
      console.log(`📊 Caption length: ${result.caption.length} characters`);
      console.log(`🏷️  Generated ${result.hashtags.length} hashtags`);
      
      return result;
    } else {
      throw new Error('No content generated from Gemini API');
    }
  } catch (error) {
    console.error('❌ Error generating Instagram content with Gemini:', error);
    throw new Error(`Failed to generate Instagram content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates Instagram caption and hashtags from a prompt (using OpenAI)
 * @param prompt - Description of the content for which to generate caption
 * @param options - Configuration options for caption generation
 * @returns Promise<InstagramContent> - Object containing caption, hashtags, and combined content
 */
export async function generateInstagramContent(
  prompt: string, 
  options: CaptionOptions = {}
): Promise<InstagramContent> {
  const {
    maxHashtags = 10,
    tone = 'casual',
    maxCaptionLength = 300,
    targetAudience = 'general social media users',
    includeCallToAction = true
  } = options;

  console.log('🎬 Generating Instagram content for reel...');
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
  
  try {
    const openai = getOpenAIClient();
    
    const systemPrompt = `You are an expert Instagram content creator and social media strategist. 
You specialize in creating viral, engaging content for Instagram Reels that drives high engagement rates.
Your content consistently performs well with the Instagram algorithm.`;
    
    const userPrompt = `Create Instagram Reel content for: "${prompt}"

Requirements:
- Tone: ${tone}
- Target audience: ${targetAudience}
- Caption max length: ${maxCaptionLength} characters
- Include ${includeCallToAction ? 'a call-to-action' : 'no call-to-action'}

Generate EXACTLY this JSON format:
{
  "caption": "[Write an engaging caption that hooks viewers, tells a story or shares value, ${includeCallToAction ? 'and includes a clear call-to-action' : ''}]",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", ...] // ${maxHashtags} relevant, trending hashtags WITHOUT # symbol
}

Focus on:
- Hook in first 3 words
- Value-driven content
- Emotion and storytelling
- Current trending hashtags
- Audience engagement
- Instagram algorithm optimization`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    // Validate and format the response
    if (!parsed.caption || !Array.isArray(parsed.hashtags)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Ensure hashtags have # symbol and are properly formatted
    const formattedHashtags = parsed.hashtags
      .map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`)
      .slice(0, maxHashtags);

    const result: InstagramContent = {
      caption: parsed.caption.trim(),
      hashtags: formattedHashtags,
      fullContent: `${parsed.caption.trim()}\n\n${formattedHashtags.join(' ')}`
    };
    
    console.log('✅ Instagram content generated successfully!');
    console.log(`📊 Caption length: ${result.caption.length} characters`);
    console.log(`🏷️  Generated ${result.hashtags.length} hashtags`);
    
    return result;
  } catch (error) {
    console.error('❌ Error generating Instagram content:', error);
    throw new Error(`Failed to generate Instagram content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateInstagramContent instead
 */
export async function generateCaption(prompt: string, options: any = {}): Promise<string> {
  console.warn('⚠️  generateCaption is deprecated. Use generateInstagramContent instead.');
  const content = await generateInstagramContent(prompt, options);
  return content.fullContent;
}

/**
 * Generates hashtags specifically for Instagram content
 * @param prompt - Description of the content
 * @param maxHashtags - Maximum number of hashtags to generate (default: 10)
 * @returns Promise<string[]> - Array of hashtags with # symbol
 */
export async function generateHashtags(prompt: string, maxHashtags: number = 10): Promise<string[]> {
  console.log('🏷️  Generating hashtags for Instagram...');
  
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a hashtag expert. Generate relevant, trending Instagram hashtags that will maximize reach and engagement."
        },
        {
          role: "user",
          content: `Generate ${maxHashtags} trending Instagram hashtags for this content: "${prompt}"

Return only a JSON array of hashtags WITHOUT the # symbol:
["hashtag1", "hashtag2", "hashtag3", ...]

Focus on:
- Popular and trending hashtags
- Niche-specific hashtags
- Mix of broad and specific tags
- Current Instagram trends`
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No hashtags generated from OpenAI');
    }

    const parsed = JSON.parse(content);
    const hashtags = (parsed.hashtags || parsed).map((tag: string) => 
      tag.startsWith('#') ? tag : `#${tag}`
    );

    console.log(`✅ Generated ${hashtags.length} hashtags successfully!`);
    return hashtags;
  } catch (error) {
    console.error('❌ Error generating hashtags:', error);
    throw new Error(`Failed to generate hashtags: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

