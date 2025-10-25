# Google Gemini Integration Setup Guide

This app uses **Google Gemini 2.5 Flash** to analyze card images with advanced AI vision via a secure backend Lambda function!

## Quick Setup (3 minutes)

### Step 1: Get Your Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API key"** or **"Create API key"**
4. Click **"Create API key in new project"** (or select an existing project)
5. **Copy your API key** (starts with `AIza...`)

### Step 2: Configure the Backend Lambda

1. Open the `template.yaml` file in the root of the project
2. Find the `AnalyzeCardFunction` section
3. Update the `GOOGLE_GEMINI_API_KEY` environment variable:

```yaml
AnalyzeCardFunction:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: CardGradingAnalyzeCard
    Environment:
      Variables:
        GOOGLE_GEMINI_API_KEY: 'AIzaSyAaSuIxhs2wYlyCrGuOzRYNrzEn7zceazM'  # Replace with your key
```

3. Save the file

### Step 3: Deploy the Backend

```bash
# Build the SAM application
sam build

# Deploy to AWS
sam deploy --resolve-s3
```

That's it! The backend Lambda will now use Google Gemini to analyze your cards securely.

## How It Works

The app uses **Google Gemini 2.5 Flash** vision model via a secure backend architecture:

1. **Backend Lambda Function** (`lambda/analyze-card/`)
   - Securely stores API key in Lambda environment variables
   - Uses **@google/generative-ai** library (server-side)
   - Direct API integration
   - No API key exposure to frontend

2. **gemini-2.5-flash-preview-05-20** (Multimodal AI Model)
   - Google's latest Gemini 2.5 Flash variant
   - Fast, cost-effective vision analysis
   - Advanced OCR for reading card text
   - Multimodal understanding (vision + language)

3. **API Gateway Endpoint**
   - Frontend calls `POST /analyze-card`
   - Sends base64-encoded image
   - Receives structured JSON response

3. **Structured JSON Extraction**
   - Sends detailed prompt requesting card information in JSON format
   - Model returns structured data with:
     - Player/character name
     - Year (production or set date)
     - Manufacturer/brand
     - Card number
     - Card type (Sports/TCG)
     - Sport or game
     - Estimated condition
   - Robust parsing handles variations in response format

4. **Fallback System**
   - If API key not configured, uses mock data for demo
   - Graceful error handling with helpful messages

## Model Details

### Gemini 2.5 Flash
- **Version**: 2.5-preview-05-20 (April 17th, 2025 preview release)
- **Input Token Limit**: 1,048,576 tokens
- **Output Token Limit**: 65,536 tokens
- **Supported Methods**: generateContent, countTokens, createCachedContent, batchGenerateContent
- **Temperature**: 1.0 (default)
- **Features**: Vision, text understanding, structured output

### Why Gemini 2.5 Flash?

- ✅ **State-of-the-art vision**: Better than open-source models at understanding images
- ✅ **Excellent OCR**: Reads card text, numbers, and fine print accurately
- ✅ **Fast inference**: Flash variant optimized for speed
- ✅ **Cost-effective**: Free tier generous enough for personal use
- ✅ **Structured output**: Reliably returns JSON-formatted data
- ✅ **Multimodal**: Processes both visual and textual information together
- ✅ **No setup complexity**: Just add API key and start using

## Pricing & Limits

### Free Tier:
- ✅ **60 requests per minute** (RPM)
- ✅ **1,500 requests per day** (RPD)
- ✅ **1 million tokens per minute** (TPM)
- ✅ No credit card required
- ✅ Sufficient for personal card grading app usage

### Paid Tier (if needed):
- Higher rate limits
- Production-level quotas
- Pay-as-you-go pricing

For most users, the **free tier is more than enough** for analyzing trading cards!

## Fallback Behavior

If the API key is not configured or the API call fails:
- App automatically falls back to **mock data**
- Shows helpful alert with setup instructions
- Still demonstrates the workflow
- You can test the app without an API key

## Troubleshooting

### "API key not configured" warning
- Make sure you've added the key to `.env` file
- Ensure the variable name is exactly: `VITE_GOOGLE_GEMINI_API_KEY`
- Restart the dev server after adding the key
- Check that your API key starts with `AIza`

### "Invalid API key" errors
- Verify your API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure you copied the complete key
- Check that the API key hasn't been restricted or deleted
- Ensure Generative Language API is enabled (should be automatic)

### "Rate limit exceeded"
- You've hit the free tier limit (60 requests/min or 1500/day)
- Wait a minute or a day depending on which limit
- Or upgrade to paid tier for higher limits

### Poor detection accuracy
- Card image quality affects results significantly
- Use clear, well-lit photos
- Front-facing card images work best
- Avoid glare and shadows
- Higher resolution images = better accuracy

## Privacy & Security

- ✅ API key stored locally in `.env` (not committed to git)
- ✅ Images sent to Google's Gemini API for analysis
- ✅ Google's privacy policy applies: [https://policies.google.com/privacy](https://policies.google.com/privacy)
- ⚠️ Don't share your API key publicly
- ⚠️ Don't commit `.env` file to git (already in `.gitignore`)
- ⚠️ Regenerate API key if accidentally exposed

## Performance Tips

1. **Image Size**: Gemini handles large images well, but smaller images = faster uploads
2. **Image Quality**: Higher quality photos = better OCR accuracy
3. **Clear Photos**: Well-lit, focused images work best
4. **Rate Limits**: Don't exceed 60 requests per minute on free tier
5. **Error Handling**: App gracefully handles failures with mock data fallback

## Testing Your Setup

Once you've added your API key and restarted the dev server:

1. Go to http://localhost:5173
2. Upload a card image (any trading card photo)
3. Click **"Analyze Card with AI"**
4. Watch the console logs to see Gemini's analysis
5. Form should auto-fill with detected card details
6. Check that all fields are populated correctly

If it works, you'll see:
- Green notification: "Form automatically filled with card details!"
- All card fields populated
- Estimated value displayed
- Console logs showing Gemini's JSON response

## Getting Help

- Google AI Studio: [https://aistudio.google.com](https://aistudio.google.com)
- Gemini API Documentation: [https://ai.google.dev/](https://ai.google.dev/)
- API Reference: [https://ai.google.dev/api](https://ai.google.dev/api)

## Next Steps

Want even better results?
1. **Upload high-quality images**: Use good lighting and focus
2. **Include card back**: Upload both front and back for more context
3. **Test different cards**: Try sports cards, Pokemon, MTG, etc.
4. **Review and edit**: Always verify auto-filled data is correct
5. **Submit for grading**: Use the form to submit to PSA, BGS, SGC, or CGC
