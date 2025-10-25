# Multi-Card Upload & Analysis Feature

## Overview

The app now supports uploading and analyzing **multiple cards simultaneously**, with each card getting its own dedicated form section and individual AI analysis.

## Key Changes

### 1. **Multiple Card Upload**
- Users can now upload multiple card images at once
- Each uploaded image creates a new card entry
- Cards are analyzed separately in parallel using Google Gemini

### 2. **Individual Card Sections**
- Each card gets its own form section with:
  - Card image preview
  - Full set of card detail fields
  - Individual value estimation
  - Remove button to delete specific cards

### 3. **Parallel AI Analysis**
- When "Analyze All Cards with AI" is clicked:
  - All cards are analyzed simultaneously (in parallel)
  - Google Gemini processes each image independently
  - Results auto-fill each card's form section
  - Failed analyses are reported individually

### 4. **Shared Submitter Information**
- Grading company selection (shared across all cards)
- Submitter contact details entered once
- Special instructions apply to entire submission

### 5. **Enhanced Submission Summary**
- Shows all cards submitted together
- Displays individual card details with images
- Calculates total declared value across all cards
- Groups cards by submission ID

## How It Works

### Upload Flow
```
1. User uploads multiple card images
   ↓
2. Each image creates a new card entry
   ↓
3. User clicks "Analyze All Cards with AI"
   ↓
4. Google Gemini analyzes each card in parallel
   ↓
5. Form sections auto-fill with AI results
   ↓
6. User reviews and adjusts details for each card
   ↓
7. User fills in submitter information (once)
   ↓
8. Submit all cards together
```

### Data Structure

**Before (Single Card):**
```javascript
{
  gradingCompany: 'psa',
  cardType: 'Sports',
  sport: 'Basketball',
  playerName: 'Michael Jordan',
  // ... other card fields
  submitterName: 'John Doe',
  email: 'john@example.com',
  // ... other submitter fields
}
```

**After (Multiple Cards):**
```javascript
{
  // Shared submitter info
  gradingCompany: 'psa',
  submitterName: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  address: '123 Main St',
  specialInstructions: 'Handle with care',

  // Array of cards
  cards: [
    {
      image: 'blob:...',
      cardType: 'Sports',
      sport: 'Basketball',
      playerName: 'Michael Jordan',
      year: '1986',
      manufacturer: 'Fleer',
      cardNumber: '#57',
      estimatedCondition: 'Near Mint',
      declaredValue: '1500'
    },
    {
      image: 'blob:...',
      cardType: 'Trading Card Game (TCG)',
      sport: 'Pokemon',
      playerName: 'Charizard',
      year: '1999',
      manufacturer: 'Pokemon Company',
      cardNumber: '4/102',
      estimatedCondition: 'Mint',
      declaredValue: '2000'
    }
    // ... more cards
  ],

  submissionId: 1729800000000
}
```

## Component Changes

### CardSubmissionForm.jsx
**State Management:**
- `submitterInfo` - Stores shared submitter details
- `cards` - Array of card objects, each with its own data and image

**New Functions:**
- `handleCardChange(cardIndex, field, value)` - Updates specific card field
- `analyzeAllCards()` - Analyzes all uploaded cards in parallel
- `removeCard(index)` - Removes a specific card
- `calculateEstimatedValueSync(cardData)` - Synchronous value calculation

**Key Features:**
- Parallel AI analysis using `Promise.all()`
- Individual error handling per card
- Dynamic form sections created for each card
- Responsive grid layout for card details

### SubmissionSummary.jsx
**New Structure:**
- Groups all cards by submission
- Shows submitter info once per submission
- Displays card grid with individual details
- Calculates and shows total declared value

### CSS Updates

**CardSubmissionForm.css:**
- `.card-section` - Individual card container
- `.card-section-header` - Card number and remove button
- `.card-image-preview` - Card image display
- `.card-details-grid` - Responsive field layout
- `.estimated-value` - Per-card value estimation
- `.cards-preview` - Upload summary section

**SubmissionSummary.css:**
- `.submission-group` - Submission container
- `.submission-info` - Submitter details
- `.cards-grid` - Multi-card display grid
- `.card-summary` - Individual card card
- `.submission-total` - Total value display

## Features

### ✅ Multiple Card Upload
- Upload 2, 5, 10, or more cards at once
- Drag and drop multiple files (browser support permitting)
- Each card gets its own preview

### ✅ Batch AI Analysis
- Click once to analyze all cards
- Parallel processing for speed
- Individual success/failure reporting
- Progress indication

### ✅ Individual Card Management
- Edit each card's details independently
- Remove unwanted cards
- Each card has its own value estimation
- Field validation per card

### ✅ Streamlined Submission
- Enter submitter info once
- Submit all cards together
- Single submission ID for tracking
- Combined shipping for all cards

### ✅ Comprehensive Summary
- See all cards submitted
- Individual card details with images
- Total declared value calculation
- Organized by submission

## Usage Example

```javascript
// Upload 3 cards:
// 1. Michael Jordan 1986 Fleer
// 2. Charizard 1999 Base Set
// 3. LeBron James 2003 Topps

// Click "Analyze All Cards with AI"
// → Google Gemini analyzes each card in ~2-3 seconds

// Review auto-filled data:
// Card #1: Michael Jordan, 1986, Fleer, Near Mint, $1500
// Card #2: Charizard, 1999, Pokemon Company, Mint, $2000
// Card #3: LeBron James, 2003, Topps, Excellent, $800

// Adjust any incorrect details

// Fill in submitter info once:
// - Name: John Doe
// - Email: john@example.com
// - Company: PSA

// Submit → All 3 cards submitted together
// Total Declared Value: $4,300
```

## Technical Implementation

### Parallel Analysis
```javascript
const analysisPromises = cards.map(async (card, index) => {
  const base64Image = await urlToBase64(card.image)
  const cardData = await analyzeCardWithGemini(base64Image)
  return { index, cardData, success: true }
})

const results = await Promise.all(analysisPromises)
```

### Dynamic Form Rendering
```javascript
{cards.map((card, index) => (
  <div key={index} className="card-section">
    <h3>Card #{index + 1}</h3>
    <img src={card.image} alt={`Card ${index + 1}`} />

    {/* Form fields for this card */}
    <input
      value={card.playerName}
      onChange={(e) => handleCardChange(index, 'playerName', e.target.value)}
    />
    {/* ... more fields */}
  </div>
))}
```

### Validation
```javascript
// Validate submitter info
if (!submitterInfo.gradingCompany) errors.gradingCompany = 'Required'

// Validate each card
cards.forEach((card, index) => {
  if (!card.playerName) {
    errors[`card${index}_playerName`] = 'Required'
  }
})
```

## Benefits

### For Users
- ✅ **Time Savings**: Upload and analyze multiple cards at once
- ✅ **Convenience**: Enter submitter info once for all cards
- ✅ **Organization**: All cards in one submission
- ✅ **Efficiency**: Parallel AI analysis is fast

### For Grading Companies
- ✅ **Batch Processing**: Multiple cards per submission
- ✅ **Complete Information**: All card details captured
- ✅ **Total Value**: Easy to calculate shipping insurance
- ✅ **Single Tracking**: One submission ID for multiple cards

## Responsive Design

- **Desktop**: Multi-column card grid
- **Tablet**: 2-column layout
- **Mobile**: Single column, stacked cards

## Error Handling

- Individual card analysis failures don't block others
- Clear error messages per card
- Option to manually fill failed cards
- Validation prevents incomplete submissions

## Future Enhancements

Potential improvements:
- Card reordering (drag and drop)
- Bulk edit fields (apply value to all cards)
- CSV import for card details
- Save draft submissions
- Duplicate card detection
- Automatic card grouping by set

---

**Status**: ✅ Production Ready
**Test**: Upload 2+ card images and click "Analyze All Cards with AI"
**Result**: Each card gets analyzed and has its own form section
