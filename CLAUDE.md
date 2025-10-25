# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm run dev
```
Starts the Vite development server with hot module replacement (HMR) at http://localhost:5173

### Building for Production
```bash
npm run build
```
Creates an optimized production build in the `dist/` directory

### Linting
```bash
npm run lint
```
Runs ESLint on the codebase to check for code quality issues

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

## Project Architecture

### Overview
This is a React application for submitting collector cards to professional grading companies (PSA, BGS, SGC, CGC). The app uses Vite as the build tool and follows a component-based architecture.

**Key Features:**
- Image upload for card photos (front/back)
- AI-powered card recognition (currently simulated - see AI_INTEGRATION.md for real API integration)
- Automatic card value estimation based on player, year, condition
- Multi-step submission workflow with validation
- Responsive design for mobile and desktop

### Key Components

**App.jsx** (`src/App.jsx`)
- Main application container
- Manages global state for submissions
- Handles view switching between form and summary
- Controls submission workflow

**CardSubmissionForm** (`src/components/CardSubmissionForm.jsx`)
- Multi-section form for card submission
- Image upload functionality with preview and removal
- AI card recognition button (currently mock implementation)
- Real-time card value estimation display
- Grading company selection with dynamic pricing/turnaround info
- Card information fields (type, sport, player, year, manufacturer, condition, value)
- Submitter contact information
- Client-side form validation with error handling
- Validates required fields and email format
- Auto-recalculates value when card details change

**SubmissionSummary** (`src/components/SubmissionSummary.jsx`)
- Displays confirmation after successful submission
- Shows all submitted cards with full details
- Displays uploaded card images in a grid
- Provides next steps guidance
- Allows users to submit additional cards

### State Management
- Uses React's built-in `useState` hooks
- Submissions stored in App component state
- Form data managed locally in CardSubmissionForm
- View state (form vs summary) controlled in App

### Styling Approach
- Component-scoped CSS modules
- Global styles in `index.css`
- App-level styles in `App.css`
- Component styles co-located with components
- Gradient background theme (purple/blue)
- Responsive design with mobile breakpoints

### Data Structure

**Grading Companies**: Array of objects with id, name, turnaround time, and price range

**Form Submission**: Object containing:
- gradingCompany (id)
- Card details (type, sport, player, year, manufacturer, number, condition, value)
- Submitter info (name, email, phone, address, special instructions)
- Auto-generated submission ID (timestamp)

### Form Validation
- Required field validation
- Email format validation
- Real-time error clearing on input
- Error messages displayed inline below fields
- Submit blocked until all validations pass

### AI Card Recognition (Google Gemini Integration)

The app uses **Google Gemini 1.5 Flash** vision model to analyze card images. When users upload images and click "Analyze Card with AI":

**Current Implementation:**
- Uses **@google/generative-ai** library
- Model: **gemini-1.5-flash** (Google's fast, cost-effective vision model)
- Benefits of using Google Gemini:
  - Advanced vision understanding
  - Accurate OCR and text extraction
  - Multimodal AI (vision + language)
  - Free tier available with generous quotas
  - Direct API integration (no third-party dependencies)
- **Structured JSON Extraction**: Sends detailed prompt requesting specific card information in JSON format
- Extracts:
  - Character/player name
  - Year (production or set date)
  - Manufacturer (Topps, Fleer, Pokemon Company, etc.)
  - Card number
  - Card type (Sports, Pokemon, Yu-Gi-Oh!, Magic: The Gathering, other TCG)
  - Sport/game category
  - Estimated condition (Mint to Poor scale)
- Auto-populates form fields and triggers value estimation
- **Fallback**: Uses mock data if API key not configured

**Setup:**
1. Get free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env` file: `VITE_GOOGLE_GEMINI_API_KEY=your_api_key`
3. Restart dev server
4. See `GEMINI_SETUP.md` for detailed guide

**Implementation Files:**
- `analyzeCard()` in `src/components/CardSubmissionForm.jsx:76-156`
- `analyzeCardWithGemini()` in `src/services/cardAnalysis.js:8-101` - Main AI integration
- `parseTextResponse()` in `src/services/cardAnalysis.js:108-173` - Fallback text parsing
- Image utilities in `src/utils/imageUtils.js`
- Environment config in `.env` (not committed to git)

**Why Google Gemini?**
- Higher accuracy than open-source models
- Better OCR for reading card text
- More reliable JSON output
- Free tier sufficient for personal use
- No inference provider setup required

### Card Value Estimation

**Algorithm** (`calculateEstimatedValue()` in CardSubmissionForm.jsx:94-136):
- Base value starts at $50
- Famous players (Jordan, LeBron, Brady, etc.) boost to $500 base
- Vintage multipliers: Pre-1970 (3x), Pre-1990 (2x)
- Condition multipliers: Mint (2.0x), Near Mint (1.5x), down to Poor (0.2x)
- 20% variance added for realistic range

**Triggers:**
- Automatically recalculates when player name, year, manufacturer, or condition changes
- Displays estimated range and average value
- Shows disclaimer about estimate accuracy

**Value Display:**
- Yellow gradient box with prominent styling
- Shows min-max range and highlighted average
- Only appears when sufficient data entered (player, year, condition)
