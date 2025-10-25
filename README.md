# Content Creation Automation Server

A comprehensive NestJS-based automation server that creates social media content automatically using AI. The system runs daily workflows that convert images, generate prompts, create captions, produce videos, and deliver the complete package via email.

## 🚀 Features

### Automated Daily Workflow (12:00 PM)
- **Image Processing:** Converts images to 9:16 aspect ratio for social media
- **AI Prompt Generation:** Uses Gemini AI to create cinematic video prompts
- **Caption & Hashtags:** Generates engaging Instagram captions with OpenAI
- **Video Creation:** Produces videos using FAL AI's image-to-video models
- **Email Delivery:** Sends complete content package with video links

### Manual API Endpoints
- Image aspect ratio conversion
- AI-powered prompt generation from images
- Instagram caption and hashtag generation
- Video generation from images
- Workflow orchestration
- Cron job management

## 🛠️ Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** (create `.env` file):
   ```bash
   # API Keys
   FAL_KEY=your_fal_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Email Configuration
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_app_password_here
   
   # Server Configuration
   PORT=9000
   ```

3. **Start the server:**
   ```bash
   npm run start:dev
   ```

4. **Test the workflow:**
   ```bash
   chmod +x test-workflow-complete.sh
   ./test-workflow-complete.sh
   ```

## 📅 Automated Scheduling

The server automatically runs the content creation workflow every day at **12:00 PM** (configurable timezone). You can:

- Check status: `curl http://localhost:9000/cron/status`
- Trigger manually: `curl -X POST http://localhost:9000/cron/trigger`
- Stop/start the schedule via API calls

## 📚 Documentation

- **[Workflow API Guide](workflow-api-docs.md)** - Complete workflow and cron job documentation
- **[Video API Guide](video-api-examples.md)** - Video generation API examples
- **[Caption API Guide](curl-examples.md)** - Caption and hashtag generation examples

## 🔧 API Endpoints

### Workflow Management
- `GET /cron/status` - Check cron job status
- `POST /cron/trigger` - Manually trigger workflow
- `POST /workflow/execute` - Execute complete workflow

### Individual Services  
- `POST /image/aspect-ratio` - Convert image aspect ratio
- `POST /image/generate-prompt` - Generate video prompt from image
- `POST /image/generate-caption` - Generate Instagram caption and hashtags
- `POST /video/generate` - Create video from base64 image

### System
- `GET /health` - Health check endpoint

## 🎯 Workflow Process

1. **Image Conversion** → Converts to 9:16 aspect ratio
2. **Prompt Generation** → AI analyzes image and creates cinematic prompt
3. **Caption Creation** → Generates engaging caption with trending hashtags  
4. **Video Production** → Creates video using the processed image and prompt
5. **Email Delivery** → Sends video link, caption, and hashtags via email

## ⚡ Quick Test

```bash
# Check if everything is working
curl http://localhost:9000/health

# Trigger a complete workflow now
curl -X POST http://localhost:9000/cron/trigger \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🔑 Required API Keys

1. **FAL AI** - For video generation ([fal.ai](https://fal.ai))
2. **Google Gemini** - For image analysis and prompt generation
3. **OpenAI** - For caption and hashtag generation
4. **Gmail App Password** - For email delivery

## 📧 Email Output

You'll receive automated emails containing:
- Direct video download link
- Ready-to-use Instagram caption
- Optimized hashtags for maximum reach
- Generated timestamp

## 🕐 Schedule Customization

Edit `src/workflow/cron.service.ts` to change the schedule:
```typescript
// Daily at 12:00 PM
const cronExpression = '0 0 12 * * *';

// Other examples:
// '0 0 9 * * *'    - 9:00 AM daily
// '0 30 18 * * *'  - 6:30 PM daily  
// '0 0 12 * * 1-5' - 12:00 PM weekdays only
```

## 🚨 Troubleshooting

1. **Server won't start:** Check if all environment variables are set
2. **Workflow fails:** Verify API keys are valid and have sufficient credits
3. **No emails received:** Confirm Gmail app password and MAIL_USER settings
4. **Image processing errors:** Ensure image URLs are accessible and valid

## 🎬 Technologies Used

- **NestJS** - Backend framework
- **Sharp** - Image processing
- **FAL AI** - Video generation
- **Google Gemini** - Image analysis
- **OpenAI** - Text generation
- **Node-cron** - Task scheduling
- **Nodemailer** - Email delivery
