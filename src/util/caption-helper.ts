import OpenAI from 'openai';

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


/**
 * Generates Instagram caption and hashtags from a prompt
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

