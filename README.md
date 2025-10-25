# Card Grading Submission Portal

A modern React application for submitting collector cards to professional grading companies. This application streamlines the process of submitting **sports cards, Pokemon cards, Magic: The Gathering, Yu-Gi-Oh!, and other trading card games (TCG)** to major grading services like PSA, BGS, SGC, and CGC.

## Features

- **Image Upload**: Upload photos of your cards (front and back) with instant preview
- **AI Card Recognition**: Powered by **Google Gemini 2.5 Flash** - automatically extracts card details from images using advanced vision AI
- **Card Value Estimation**: Get instant estimated values based on player, year, condition, and market data
- **Multiple Grading Companies**: Choose from PSA, BGS, SGC, or CGC with real-time pricing and turnaround information
- **Comprehensive Form**: Capture all necessary card details including:
  - Card type and sport
  - Player/subject information
  - Year and manufacturer
  - Condition estimates
  - Declared value
- **Form Validation**: Real-time validation ensures all required information is provided
- **Submission Summary**: Review all submitted cards with images and detailed confirmation
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with gradient styling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. **Configure AI (Optional but Recommended)**:
   - Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Add your API key to `.env`:
   ```bash
   VITE_GOOGLE_GEMINI_API_KEY=your_api_key_here
   ```
   - See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed instructions
   - **Note**: App works without API key (uses mock data for demo)

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to [http://localhost:5173](http://localhost:5173)

### Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

## Project Structure

```
src/
├── components/
│   ├── CardSubmissionForm.jsx    # Main submission form
│   ├── CardSubmissionForm.css    # Form styling
│   ├── SubmissionSummary.jsx     # Confirmation view
│   └── SubmissionSummary.css     # Summary styling
├── App.jsx                        # Main application component
├── App.css                        # App-level styles
├── main.jsx                       # Application entry point
└── index.css                      # Global styles
```

## Grading Companies Supported

- **PSA** (Professional Sports Authenticator) - 10-45 day turnaround, $20-$150
- **BGS** (Beckett Grading Services) - 15-60 day turnaround, $25-$200
- **SGC** (Sportscard Guaranty) - 5-30 day turnaround, $15-$100
- **CGC** (Certified Guaranty Company) - 20-40 day turnaround, $18-$125

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool and development server
- **ESLint** - Code quality and linting

## Development

This project uses Vite for fast development and hot module replacement (HMR). The application is built with functional React components using hooks for state management.

### Component Architecture

- `App.jsx` - Manages global state and view switching
- `CardSubmissionForm.jsx` - Handles form input and validation
- `SubmissionSummary.jsx` - Displays submission confirmation

### Styling

The application uses component-scoped CSS files with a modern gradient theme. Responsive breakpoints ensure the app works well on all screen sizes.

## AI Card Recognition

The app uses **Google Gemini 2.5 Flash** to analyze card images and extract details.

**Current Implementation:**
- **Powered by**: Google Gemini 2.5 Flash (Google's latest multimodal AI)
- **Free tier**: Generous free quotas available
- **Direct API**: Uses @google/generative-ai library for browser/Node.js
- **Structured extraction**: Requests JSON output with all card details
- **Analyzes**: Character/player name, year, manufacturer, card number, card type (Sports/TCG), sport/game, condition
- **Advanced OCR**: Reads text directly from card images
- **Supports**: Sports cards, Pokemon, Yu-Gi-Oh!, Magic: The Gathering, and other TCG cards
- **Fallback**: Uses mock data if API key not configured

**Setup** (2 minutes):
1. Get free API key: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Add to `.env`: `VITE_GOOGLE_GEMINI_API_KEY=your_api_key`
3. Restart dev server
4. See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed guide

**Why Google Gemini?**
- ✅ Higher accuracy than open-source models
- ✅ Better OCR for reading card text and numbers
- ✅ More reliable structured output
- ✅ Fast inference with Flash variant
- ✅ No setup complexity (no inference providers needed)
- ✅ Free tier sufficient for personal use

## Card Value Estimation

The app automatically estimates card values based on:
- **Sports Cards**: Player name (premium for famous players like Jordan, LeBron), year, condition
- **Pokemon Cards**: Character name (premium for Charizard, Pikachu, etc.), vintage sets (1999 Base Set), condition
- **Magic: The Gathering**: Card name (premium for Black Lotus, Power 9), rarity, condition
- **General**: Year (vintage cards valued higher), manufacturer, condition (Mint to Poor scale)

Values are calculated client-side using market-based algorithms and displayed in real-time as users fill out the form. The algorithm automatically detects card type and applies appropriate valuation logic.

## License

For demonstration purposes only.
