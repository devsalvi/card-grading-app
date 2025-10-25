# Card Grading App - Feature Guide

## Auto-Fill from Card Image Analysis

When you upload a card image and click **"Analyze Card with AI"**, the app automatically fills out the grading form with detected information.

### Fields Auto-Filled by AI Analysis:

1. **Character/Player Name** - Extracted from card text (e.g., Michael Jordan, Charizard, Black Lotus)
2. **Year** - Card year/vintage or set release date
3. **Manufacturer** - Card brand (e.g., Topps, Pokemon Company, Wizards of the Coast)
4. **Card Number** - Set number on the card
5. **Card Type** - Automatically detected: Sports, Trading Card Game (TCG), or Other
6. **Sport/Game** - Basketball, Pokemon, Magic: The Gathering, Yu-Gi-Oh!, etc.
7. **Estimated Condition** - Visual assessment (Mint to Poor)
8. **Declared Value** - Automatically set to the estimated average value based on card type

### Workflow:

```
1. Upload card image(s) 📸
   ↓
2. Click "Analyze Card with AI" 🤖
   ↓
3. Wait 2 seconds for analysis ⏳
   ↓
4. Form auto-fills with card details ✓
   ↓
5. Card value estimation appears 💰
   ↓
6. Declared value field auto-populated 📝
   ↓
7. Green notification confirms auto-fill ✓
   ↓
8. Review and adjust if needed 👀
   ↓
9. Fill in your contact information 📧
   ↓
10. Submit to grading company 🚀
```

### Current Implementation:

- Uses **Google Gemini 2.5 Flash** vision model
- **Structured JSON extraction**: Sends detailed prompt requesting specific card information
- **Advanced OCR**: Reads text, numbers, and fine print directly from card images
- **Multimodal AI**: Processes both visual and textual information together
- **Supports multiple card types**: Sports, Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and other TCG
- Recognizes famous players, popular Pokemon, and valuable MTG cards
- Automatically extracts: name, year, manufacturer, card number, type, sport/game, condition
- Falls back to mock data if API key not configured

### Setup:

- Get free API key: [Google AI Studio](https://aistudio.google.com/app/apikey)
- Add to `.env`: `VITE_GOOGLE_GEMINI_API_KEY=your_key`
- See **[GEMINI_SETUP.md](GEMINI_SETUP.md)** for detailed guide
- Free tier includes 60 requests/min and 1500 requests/day

## Card Value Estimation

### How It Works:

The app calculates estimated card values using a multi-factor algorithm:

**Base Value:** $50

**Player Premium:**
- Famous players (Jordan, LeBron, Brady, Mantle, Ruth, Gretzky): **$500 base**
- Other players: $50 base

**Vintage Multipliers:**
- Pre-1970 cards: **3x multiplier**
- 1970-1989 cards: **2x multiplier**
- 1990+ cards: 1x (no multiplier)

**Condition Multipliers:**
- Mint: **2.0x**
- Near Mint: **1.5x**
- Excellent: **1.2x**
- Very Good: **1.0x**
- Good: **0.7x**
- Fair: **0.4x**
- Poor: **0.2x**

**Calculation Examples:**

*Sports Card:*
```
Michael Jordan (famous player): $500 base
1986 (pre-1990): 2x multiplier = $1000
Near Mint condition: 1.5x multiplier = $1500
± 20% variance range = $1200 - $1800
Average: $1500
```

*Pokemon Card:*
```
Charizard (popular Pokemon): $300 base
1999 Base Set (vintage): 4x multiplier = $1200
Near Mint condition: 1.5x multiplier = $1800
± 20% variance range = $1440 - $2160
Average: $1800
```

*Magic: The Gathering:*
```
Black Lotus (Power 9): $2000 base
Mint condition: 2.0x multiplier = $4000
± 20% variance range = $3200 - $4800
Average: $4000
```

### Value Display:

- Shows estimated **range** (min - max)
- Shows **average value** (highlighted)
- Auto-fills the **declared value** field
- Includes disclaimer about estimate accuracy

### When Value Updates:

The estimated value automatically recalculates when you change:
- Player/subject name
- Year
- Manufacturer
- Estimated condition

## Visual Feedback

### Success Notifications:

**Auto-Fill Notification** (Green banner):
- Appears after AI analysis completes
- Shows: "✓ Form automatically filled with card details! Review and adjust as needed."
- Auto-dismisses after 5 seconds
- Smooth slide-in animation

**Value Estimation Box** (Yellow gradient):
- Prominent display with pricing info
- Shows range and average
- Includes disclaimer text
- Only appears when sufficient data entered

### Form States:

- **Analyzing**: Button shows "Analyzing Card..." and is disabled
- **Auto-Filled**: Green notification banner appears
- **Value Estimated**: Yellow value box displays below images
- **Ready to Submit**: All required fields filled, submit button enabled

## User Benefits

✅ **Time Savings** - No manual typing of card details
✅ **Accuracy** - AI reduces human error in data entry
✅ **Value Insight** - Instant market value estimates
✅ **Confidence** - Know your card's worth before grading
✅ **Convenience** - Pre-filled declared value for insurance
✅ **Transparency** - See how values are calculated

## Tips for Best Results

1. **Photo Quality**: Upload clear, well-lit images of card front and back
2. **Review Data**: Always verify auto-filled information is accurate
3. **Adjust Values**: You can edit any auto-filled field if needed
4. **Multiple Cards**: Analyze and submit cards one at a time
5. **Save Time**: Let AI handle the data entry, you handle verification
