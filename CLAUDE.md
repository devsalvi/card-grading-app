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

The app uses **Google Gemini 2.5 Flash** vision model to analyze card images via a secure backend API. When users upload images and click "Analyze Card with AI":

**Current Implementation:**
- **Backend Lambda Function**: `CardGradingAnalyzeCard` (lambda/analyze-card/)
- **API Endpoint**: `POST /analyze-card`
- **Model**: **gemini-2.5-flash-preview-05-20** (Google's latest fast vision model)
- Benefits of backend implementation:
  - **Secure**: API key never exposed to frontend
  - **Controlled**: Rate limiting and usage monitoring in Lambda
  - **Scalable**: Auto-scales with Lambda
  - **Cost-effective**: Free tier + pay per use
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
- **Fallback**: Returns mock data if API key not configured in Lambda

**Setup:**
1. Get free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Update `template.yaml` Lambda environment variable: `GOOGLE_GEMINI_API_KEY`
3. Deploy with `sam build && sam deploy --resolve-s3`
4. See `GEMINI_SETUP.md` for detailed guide

**Implementation Files:**
- **Backend**: `lambda/analyze-card/index.js` - Lambda function with Gemini integration
- **Frontend**: `src/services/cardAnalysis.js` - API client to call backend
- `analyzeCard()` in `src/components/CardSubmissionForm.jsx` - UI integration
- Image utilities in `src/utils/imageUtils.js`

**Why Google Gemini?**
- Higher accuracy than open-source models
- Better OCR for reading card text
- More reliable JSON output
- Latest 2.5 Flash model for improved results
- Free tier sufficient for personal use

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

### Backend Infrastructure (AWS)

**DynamoDB Table**: CardGradingSubmissions
- Partition key: submissionId (String)
- Global Secondary Index: EmailIndex (email + submittedAt)
- TTL enabled (90 days auto-deletion)
- Point-in-time recovery enabled

**Lambda Functions**:
- `CardGradingSubmitFunction` - Handles public submissions (POST /submissions)
- `CardGradingAdminGetSubmission` - Admin endpoint to get submission by ID
- `CardGradingAdminListSubmissions` - Admin endpoint to list all submissions
- `CardGradingAdminSearchByEmail` - Admin endpoint to search by email

**API Gateway**:
- Public endpoint: `POST /submissions`
- Protected endpoints (require Cognito auth):
  - `GET /admin/submissions/{submissionId}`
  - `GET /admin/submissions?limit=50&lastKey=...`
  - `GET /admin/search?email=...`

**Deployment**:
- Uses AWS SAM (Serverless Application Model)
- Command: `sam build && sam deploy --resolve-s3`
- CloudFormation stack: `card-grading-backend`

### Authentication & Authorization (Optional)

**AWS Cognito Setup**:
- User Pool: `CardGradingUserPool` (us-east-1_zHIFesZkh)
- App Client: Web client for React app (22qeq1vs1q666m5s88q5oakf9t)
- User Group: "Admins" - grants access to admin dashboard

**Frontend Auth (AWS Amplify)**:
- `src/services/authService.js` - Authentication operations
  - signUpUser(), signInUser(), signOutUser()
  - getCurrentAuthUser(), getAuthToken()
  - isAuthenticated(), isAdmin()
- `src/services/adminService.js` - Admin API calls with JWT tokens
  - getSubmissionById(), listAllSubmissions(), searchSubmissionsByEmail()

**Components**:
- `Login.jsx` - Sign in/sign up UI with email verification flow and social login options
- `AdminDashboard.jsx` - Protected admin interface
  - Search submissions by ID
  - View recent submissions in table (filtered by company if not Super Admin)
  - Display full submission details including cards
  - Admin group check enforced
  - Shows company badge (PSA, BGS, SGC, CGC) or Super Admin badge
- `SocialLoginButton.jsx` - Social login banner for main page
  - Google and Facebook login options
  - Shows authenticated user info when signed in
  - Auto-fills submission form with user profile data

**Routing & Protection**:
- React Router with two main routes:
  - `/` - Main public submission page (MainPage.jsx)
  - `/admin` - Dedicated admin portal (AdminPortal.jsx)
- Admin portal is completely separate from main submission interface
- Automatic redirect to dashboard if user is already authenticated
- Sign out returns to admin login view
- Social login available on both main page and admin portal

**Company-Specific Admin Groups**:
- **PSA-Admins** - Access to PSA submissions only
- **BGS-Admins** - Access to BGS submissions only
- **SGC-Admins** - Access to SGC submissions only
- **CGC-Admins** - Access to CGC submissions only
- **Super-Admins** - Access to all submissions across all companies

**Creating Admin Users**:

**Self-Service Signup (Recommended)**:
- Admins can sign up directly at `/admin` with company-specific codes
- Select company from dropdown during signup
- Enter admin code for validation
- Automatically assigned to correct admin group after email confirmation
- Codes stored in Lambda environment variables
- See `ADMIN_SELF_SIGNUP.md` for details

**Manual Assignment (Alternative)**:
```bash
# Use helper script for company-specific admins
./scripts/assign-company-admin.sh

# Interactive menu allows selecting:
# 1. PSA, 2. BGS, 3. SGC, 4. CGC, 5. Super Admin

# Or manually via AWS CLI
aws cognito-idp admin-create-user --user-pool-id us-east-1_zHIFesZkh --username admin@example.com
aws cognito-idp admin-set-user-password --user-pool-id us-east-1_zHIFesZkh --username admin@example.com --password YourPassword123 --permanent
aws cognito-idp admin-add-user-to-group --user-pool-id us-east-1_zHIFesZkh --username admin@example.com --group-name PSA-Admins
```

**Social Login (OAuth)**:
- Supports Google and Facebook authentication via Cognito Hosted UI
- Auto-populates submission form with user profile data (name, email, address, phone)
- Available on both main submission page and admin portal
- Configuration required in `.env`:
  - `VITE_COGNITO_DOMAIN` - Cognito domain for OAuth redirects
- See `SOCIAL_LOGIN_SETUP.md` for complete setup instructions

**Security Features**:
- Password policy: min 8 chars, uppercase, lowercase, number
- Token expiration: Access/ID tokens 60min, Refresh token 30 days
- API Gateway Cognito authorizer validates JWT tokens
- Lambda functions verify admin group membership and company access
- Returns 403 Forbidden if user not in correct admin group
- Company admins can only view submissions for their company
- Super Admins can view all submissions

**Environment Variables** (`.env`):
```
VITE_COGNITO_USER_POOL_ID=us-east-1_zHIFesZkh
VITE_COGNITO_CLIENT_ID=22qeq1vs1q666m5s88q5oakf9t
VITE_AWS_REGION=us-east-1
VITE_COGNITO_DOMAIN=card-grading-923849122289
```

See `AUTHENTICATION_SETUP.md` for detailed setup instructions.
