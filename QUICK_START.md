# Quick Start Guide

## 🚀 Get Running in 2 Minutes

### Without AI (Demo Mode)
```bash
npm install
npm run dev
```
Open http://localhost:5173 - **Works immediately with mock data!**

### With Real AI (5 minutes)
```bash
# 1. Install
npm install

# 2. Get FREE Hugging Face API key
# Visit: https://huggingface.co/settings/tokens
# Click "New token" → Copy token

# 3. Configure
echo "VITE_HUGGINGFACE_API_KEY=hf_your_token_here" > .env

# 4. Run
npm run dev
```

## 🎯 How to Use

1. **Upload Card Image** 📸
   - Click "Upload Card Images"
   - Select front/back photos

2. **Analyze with AI** 🤖
   - Click "Analyze Card with AI"
   - Wait 5-10 seconds
   - Form auto-fills!

3. **Review & Submit** ✅
   - Check auto-filled details
   - Add your contact info
   - Submit to grading company

## 📊 What Gets Auto-Filled

- ✅ Player/Subject Name
- ✅ Year
- ✅ Manufacturer
- ✅ Card Number
- ✅ Card Type
- ✅ Sport
- ✅ Estimated Condition
- ✅ Declared Value (from estimation)

## 🆓 Free Tier Limits

**Hugging Face Free:**
- ~1000 requests/month
- No credit card needed
- Perfect for testing

## 🔧 Troubleshooting

**App shows mock data?**
- Check `.env` file exists
- Verify API key starts with `hf_`
- Restart server: `npm run dev`

**"Model is loading" error?**
- Wait 30 seconds, try again
- First request warms up the model

**Poor accuracy?**
- Use clear, well-lit photos
- Front-facing card images
- Try uploading again

## 📚 More Info

- **Full Setup**: [HUGGINGFACE_SETUP.md](HUGGINGFACE_SETUP.md)
- **Architecture**: [CLAUDE.md](CLAUDE.md)
- **Features**: [FEATURES.md](FEATURES.md)
- **Alternative APIs**: [AI_INTEGRATION.md](AI_INTEGRATION.md)

## 💡 Pro Tips

1. **Better Photos = Better Results**
   - Good lighting
   - Clear focus
   - Flat surface

2. **Review Before Submit**
   - AI isn't perfect
   - Double-check values
   - Edit if needed

3. **Save API Calls**
   - Test with mock data first
   - Use real API for final submissions
   - ~100 requests/hour limit

## 🎁 What's Included

- ✅ React 19 + Vite
- ✅ Google PaliGemma AI vision (via Hugging Face)
- ✅ Image upload & preview
- ✅ Auto-fill form
- ✅ Value estimation
- ✅ 4 grading companies
- ✅ Responsive design
- ✅ Mock data fallback

## 🚦 Current Status

**Working Now:**
- ✅ Image upload
- ✅ AI analysis (with API key)
- ✅ Value estimation
- ✅ Form auto-fill
- ✅ Submission workflow

**Demo/Mock:**
- ⚠️ Grading submission (not sent to real companies)
- ⚠️ Value estimation (simplified algorithm)

**Coming Soon:**
- 🔜 Backend integration
- 🔜 User accounts
- 🔜 Submission tracking
- 🔜 Payment processing
