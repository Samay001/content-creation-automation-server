# CURL Examples for Caption Generator API

This file contains various curl commands to test the Instagram caption generation endpoint.

## Base URL
- Local Development: `http://localhost:9000`
- Endpoint: `POST /image/generate-caption`

---

## 1. Basic Caption Generation

### Simple Request
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Making homemade chocolate chip cookies from scratch"
  }'
```

### Expected Response
```json
{
  "caption": "Fresh cookies straight from the oven! 🍪 There's nothing like the smell of homemade chocolate chip cookies filling your kitchen. Save this recipe for your next baking adventure! ✨",
  "hashtags": ["#HomeBaking", "#ChocolateChipCookies", "#FromScratch", "#BakingLife", "#CookieRecipe", "#HomemadeGoodness", "#BakeAtHome", "#TreatYourself", "#WeekendBaking", "#BakingLove"],
  "fullContent": "Fresh cookies straight from the oven! 🍪 There's nothing like the smell of homemade chocolate chip cookies filling your kitchen. Save this recipe for your next baking adventure! ✨\n\n#HomeBaking #ChocolateChipCookies #FromScratch #BakingLife #CookieRecipe #HomemadeGoodness #BakeAtHome #TreatYourself #WeekendBaking #BakingLove",
  "metadata": {
    "captionLength": 142,
    "hashtagCount": 10,
    "generatedAt": "2025-01-11T10:30:00.000Z"
  }
}
```

---

## 2. Advanced Options

### Casual Tone with Call-to-Action
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "30-minute high-intensity workout routine for busy professionals",
    "options": {
      "tone": "casual",
      "maxHashtags": 8,
      "maxCaptionLength": 200,
      "includeCallToAction": true,
      "targetAudience": "working professionals"
    }
  }'
```

### Professional Tone
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Technology review of the latest smartphone features",
    "options": {
      "tone": "professional",
      "maxHashtags": 12,
      "maxCaptionLength": 250,
      "includeCallToAction": false,
      "targetAudience": "tech enthusiasts"
    }
  }'
```

### Inspirational Tone for Fitness Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Early morning gym session before work",
    "options": {
      "tone": "inspirational",
      "maxHashtags": 15,
      "maxCaptionLength": 300,
      "includeCallToAction": true,
      "targetAudience": "fitness enthusiasts"
    }
  }'
```

### Funny Tone for Food Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Failed attempt at making sourdough bread that turned into a pancake",
    "options": {
      "tone": "funny",
      "maxHashtags": 6,
      "maxCaptionLength": 150,
      "includeCallToAction": false,
      "targetAudience": "home bakers"
    }
  }'
```

### Trendy Tone for Travel Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Exploring hidden coffee shops in Tokyo backstreets",
    "options": {
      "tone": "trendy",
      "maxHashtags": 20,
      "maxCaptionLength": 280,
      "includeCallToAction": true,
      "targetAudience": "travel enthusiasts and coffee lovers"
    }
  }'
```

### Educational Tone for Tutorial Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Step-by-step tutorial on basic photography composition rules",
    "options": {
      "tone": "educational",
      "maxHashtags": 10,
      "maxCaptionLength": 350,
      "includeCallToAction": true,
      "targetAudience": "photography beginners"
    }
  }'
```

---

## 3. Different Content Types

### Beauty/Skincare Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Morning skincare routine with natural products and face massage techniques",
    "options": {
      "tone": "casual",
      "maxHashtags": 12,
      "targetAudience": "skincare enthusiasts"
    }
  }'
```

### Business/Entrepreneurship Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Young entrepreneur working on laptop in a modern coworking space",
    "options": {
      "tone": "inspirational",
      "maxHashtags": 8,
      "targetAudience": "aspiring entrepreneurs"
    }
  }'
```

### Fashion/Style Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Styling one dress three different ways for different occasions",
    "options": {
      "tone": "trendy",
      "maxHashtags": 15,
      "targetAudience": "fashion enthusiasts"
    }
  }'
```

### Pet Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Golden retriever learning new tricks in the park",
    "options": {
      "tone": "funny",
      "maxHashtags": 10,
      "targetAudience": "pet owners"
    }
  }'
```

### DIY/Crafting Content
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Upcycling old furniture into modern home decor pieces",
    "options": {
      "tone": "educational",
      "maxHashtags": 14,
      "targetAudience": "DIY enthusiasts and home decorators"
    }
  }'
```

---

## 4. Error Handling Examples

### Missing Required Field
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "tone": "casual"
    }
  }'
```
**Expected Response:**
```json
{
  "error": "Image prompt is required"
}
```

### Empty Image Prompt
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": ""
  }'
```

---

## 5. Testing with Different Hashtag Counts

### Minimal Hashtags (5)
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Quick 5-minute meditation session in nature",
    "options": {
      "maxHashtags": 5
    }
  }'
```

### Maximum Hashtags (30 - Instagram limit)
```bash
curl -X POST http://localhost:9000/image/generate-caption \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Complete guide to sustainable living and zero waste lifestyle",
    "options": {
      "maxHashtags": 30
    }
  }'
```

---

## 6. Batch Testing Script

Create a bash script to test multiple scenarios:

```bash
#!/bin/bash

BASE_URL="http://localhost:9000"
ENDPOINT="/image/generate-caption"

echo "🧪 Testing Caption Generation API..."

# Test 1: Basic request
echo "📝 Test 1: Basic caption generation"
curl -s -X POST ${BASE_URL}${ENDPOINT} \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Cooking pasta with fresh ingredients"
  }' | jq .

echo -e "\n---\n"

# Test 2: With options
echo "📝 Test 2: With custom options"
curl -s -X POST ${BASE_URL}${ENDPOINT} \
  -H "Content-Type: application/json" \
  -d '{
    "imagePrompt": "Morning workout routine",
    "options": {
      "tone": "inspirational",
      "maxHashtags": 8
    }
  }' | jq .

echo -e "\n---\n"

# Test 3: Error case
echo "📝 Test 3: Missing prompt (error case)"
curl -s -X POST ${BASE_URL}${ENDPOINT} \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

echo -e "\n✅ Testing completed!"
```

Save as `test-caption-api.sh` and run with:
```bash
chmod +x test-caption-api.sh
./test-caption-api.sh
```

---

## 7. PowerShell Examples (Windows)

### Basic Request
```powershell
$body = @{
    imagePrompt = "Making homemade pizza from scratch"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9000/image/generate-caption" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### With Options
```powershell
$body = @{
    imagePrompt = "Yoga session at sunrise on the beach"
    options = @{
        tone = "inspirational"
        maxHashtags = 12
        includeCallToAction = $true
    }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:9000/image/generate-caption" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

---

## 8. JavaScript/Node.js Example

```javascript
const axios = require('axios');

async function generateCaption(prompt, options = {}) {
  try {
    const response = await axios.post('http://localhost:9000/image/generate-caption', {
      imagePrompt: prompt,
      options: options
    });
    
    console.log('Generated Caption:', response.data.caption);
    console.log('Hashtags:', response.data.hashtags.join(' '));
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Usage
generateCaption('Learning to play guitar as an adult', {
  tone: 'inspirational',
  maxHashtags: 10
});
```

---

## 9. Python Example

```python
import requests
import json

def generate_caption(prompt, options=None):
    url = "http://localhost:9000/image/generate-caption"
    data = {
        "imagePrompt": prompt
    }
    
    if options:
        data["options"] = options
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"Caption: {result['caption']}")
        print(f"Hashtags: {' '.join(result['hashtags'])}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Usage
generate_caption("Cooking healthy meal prep for the week", {
    "tone": "educational",
    "maxHashtags": 8,
    "targetAudience": "health-conscious individuals"
})
```

---

## Notes

- Make sure the server is running (`npm run start:dev`)
- Ensure `OPENAI_API_KEY` is set in your environment variables
- The server runs on port 9000 by default (configurable via `PORT` environment variable)
- All requests should use `Content-Type: application/json`
- The `imagePrompt` field is required
- All options are optional and have default values