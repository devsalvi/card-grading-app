# AI Card Recognition Integration Guide

## Current Implementation

The app currently uses **mock/simulated card recognition** for demonstration purposes. When a user uploads an image and clicks "Analyze Card with AI", it simulates an AI response with sample data.

## Integrating Real AI Vision

To implement real card recognition using AI vision models, you have several options:

### Option 1: OpenAI GPT-4 Vision API

**Backend Implementation (Node.js/Express example):**

```javascript
// server/api/analyze-card.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeCard(imageBase64) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this trading card image and extract: player name, year, manufacturer, card number, sport/type, and estimated condition. Return as JSON."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: 500
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**Frontend Integration:**

```javascript
// In CardSubmissionForm.jsx - replace the analyzeCard function
const analyzeCard = async () => {
  if (cardImages.length === 0) return;

  setAnalyzing(true);

  try {
    // Convert image to base64
    const imageBlob = await fetch(cardImages[0]).then(r => r.blob());
    const base64 = await blobToBase64(imageBlob);

    // Call your backend API
    const response = await fetch('/api/analyze-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
    });

    const cardData = await response.json();

    setFormData(prev => ({
      ...prev,
      playerName: cardData.playerName,
      year: cardData.year,
      manufacturer: cardData.manufacturer,
      cardNumber: cardData.cardNumber,
      cardType: cardData.cardType,
      sport: cardData.sport,
      estimatedCondition: cardData.condition
    }));

    calculateEstimatedValue(cardData);
  } catch (error) {
    console.error('Card analysis failed:', error);
    alert('Failed to analyze card. Please enter details manually.');
  } finally {
    setAnalyzing(false);
  }
};
```

### Option 2: Anthropic Claude with Vision

```javascript
// server/api/analyze-card.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function analyzeCard(imageBase64) {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            type: "text",
            text: "Analyze this trading/sports card and extract: player/subject name, year, manufacturer, card number, type (sports/TCG/etc), sport (if applicable), and estimated condition (Mint/Near Mint/Excellent/Very Good/Good/Fair/Poor). Return as JSON with keys: playerName, year, manufacturer, cardNumber, cardType, sport, condition."
          }
        ]
      }
    ]
  });

  return JSON.parse(message.content[0].text);
}
```

### Option 3: Serverless Function (Vercel/Netlify)

**Vercel Serverless Function Example:**

```javascript
// api/analyze-card.js
import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this card and extract details as JSON..."
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}` }
            }
          ]
        }
      ]
    });

    const cardData = JSON.parse(response.choices[0].message.content);
    res.status(200).json(cardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Required Environment Variables

Add to `.env.local`:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# OR Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

## Helper Functions

```javascript
// utils/imageUtils.js
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

## Cost Considerations

- **OpenAI GPT-4 Vision**: ~$0.01-0.03 per image
- **Anthropic Claude Vision**: ~$0.015-0.025 per image
- **Google Cloud Vision**: ~$0.0015 per image (but less specialized)

## Rate Limiting

Implement rate limiting on your backend to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/analyze-card', limiter);
```

## Security Best Practices

1. **Never expose API keys** in frontend code
2. **Validate image sizes** before processing (limit to 5MB)
3. **Implement authentication** to prevent unauthorized use
4. **Use CORS** properly to restrict API access
5. **Sanitize outputs** from AI before displaying to users

## Testing

For development/testing without costs, keep the mock implementation or use a fixed response until ready to integrate the real API.
