# Authentication & Admin Access Setup Guide

This guide explains how to set up and use the authentication system for the Card Grading App.

## Overview

The app includes **optional** authentication using AWS Cognito, which enables an admin dashboard where authorized users can:
- Search for submissions by ID
- View detailed submission information
- List recent submissions
- Access protected admin-only endpoints

## Architecture

### Backend (AWS)
- **AWS Cognito User Pool**: Manages user authentication
- **Cognito User Group**: "Admins" group for admin privileges
- **API Gateway Authorizer**: Protects admin endpoints with Cognito JWT tokens
- **Lambda Functions**: Admin operations (getSubmission, listSubmissions, searchByEmail)

### Frontend (React)
- **AWS Amplify**: Handles authentication flows
- **Login Component**: Sign in/sign up UI
- **Admin Dashboard**: Protected admin interface
- **Auth Service**: Centralized authentication logic

## Setup Instructions

### 1. Backend Deployment

The authentication infrastructure is already deployed with your backend. You should see these outputs from `sam deploy`:

```
UserPoolId: us-east-1_zHIFesZkh
UserPoolClientId: 22qeq1vs1q666m5s88q5oakf9t
```

These values are already configured in your `.env` file.

### 2. Create Your First Admin User

#### Option A: Using AWS Console

1. Go to AWS Cognito Console: https://console.aws.amazon.com/cognito/
2. Select your User Pool: `CardGradingUserPool`
3. Click "Users" → "Create user"
4. Enter:
   - **Username**: your-email@example.com
   - **Email**: your-email@example.com
   - **Temporary password**: TempPassword123!
   - **Email verified**: ✓ Mark as verified
   - **Send invitation email**: Optional
5. Click "Create user"
6. Add user to Admins group:
   - Select the user
   - Click "Groups" tab
   - Click "Add user to group"
   - Select "Admins"
   - Click "Add"

#### Option B: Using AWS CLI

```bash
# Set variables
USER_POOL_ID="us-east-1_zHIFesZkh"
EMAIL="your-email@example.com"
TEMP_PASSWORD="TempPassword123!"

# Create user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --user-attributes Name=email,Value=$EMAIL Name=email_verified,Value=true \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --password $TEMP_PASSWORD \
  --permanent

# Add user to Admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --group-name Admins

echo "✓ Admin user created: $EMAIL"
echo "✓ Password: $TEMP_PASSWORD"
echo "✓ Added to Admins group"
```

### 3. First Login

1. Start the dev server: `npm run dev`
2. Open http://localhost:5173/
3. Click the "Admin" button in the header
4. Sign in with your email and password
5. You'll be redirected to the Admin Dashboard

## Using the Admin Dashboard

### Search Submissions

1. Enter a submission ID in the search box (e.g., `1729123456789`)
2. Click "Search"
3. View full submission details including:
   - Submitter information
   - Grading company
   - Card details
   - Status and timestamps

### View Recent Submissions

- The dashboard shows the 10 most recent submissions
- Click "View" on any submission to see details
- Table displays: ID, submitter, email, card count, status, submission date

## API Endpoints

### Public Endpoints (No Auth Required)

```
POST /submissions
```
Submit a new card grading request

### Protected Admin Endpoints (Cognito Auth Required)

```
GET /admin/submissions/{submissionId}
```
Get submission by ID

```
GET /admin/submissions?limit=50&lastKey=...
```
List all submissions (paginated)

```
GET /admin/search?email=user@example.com
```
Search submissions by email

### Making Authenticated API Calls

Include the Cognito ID token in the Authorization header:

```javascript
const token = await getAuthToken();

fetch('https://YOUR_API/admin/submissions/123', {
  headers: {
    'Authorization': token,
    'Content-Type': 'application/json'
  }
});
```

## Security Features

### Password Policy
- Minimum 8 characters
- Must include uppercase letter
- Must include lowercase letter
- Must include number
- Special characters optional

### Token Expiration
- Access Token: 60 minutes
- ID Token: 60 minutes
- Refresh Token: 30 days

### Authorization Checks

The Lambda functions verify:
1. Valid Cognito token (via API Gateway authorizer)
2. User is in "Admins" group
3. Returns 403 Forbidden if not admin

## User Management

### Adding More Admin Users

Use the AWS CLI commands from above, or:

```bash
# Create script
cat > create-admin.sh << 'EOF'
#!/bin/bash
USER_POOL_ID="us-east-1_zHIFesZkh"
read -p "Enter email: " EMAIL
read -s -p "Enter password: " PASSWORD
echo

aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --user-attributes Name=email,Value=$EMAIL Name=email_verified,Value=true \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --password $PASSWORD \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username $EMAIL \
  --group-name Admins

echo "✓ Admin user created successfully"
EOF

chmod +x create-admin.sh
./create-admin.sh
```

### Removing Admin Access

```bash
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --username user@example.com \
  --group-name Admins
```

### Deleting Users

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username user@example.com
```

## Troubleshooting

### "Access Denied" Error

**Cause**: User is not in the Admins group
**Solution**: Add user to group via AWS Console or CLI

### "Not authenticated" Error

**Cause**: Token expired or invalid
**Solution**: Sign out and sign in again

### "Authentication Not Configured" Message

**Cause**: Missing Cognito environment variables
**Solution**: Check `.env` file contains:
```
VITE_COGNITO_USER_POOL_ID=us-east-1_zHIFesZkh
VITE_COGNITO_CLIENT_ID=22qeq1vs1q666m5s88q5oakf9t
VITE_AWS_REGION=us-east-1
```

### Password Requirements Error

**Cause**: Password doesn't meet policy
**Solution**: Ensure password has:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Sign In Request
       ▼
┌─────────────────┐
│  AWS Cognito    │
│   User Pool     │
└────────┬────────┘
         │
         │ 2. Returns JWT Token
         │
         ▼
┌─────────────────┐
│  React App      │
│  (Amplify)      │
└────────┬────────┘
         │
         │ 3. API Request + Token
         ▼
┌─────────────────┐
│  API Gateway    │
│  + Authorizer   │─────┐
└────────┬────────┘     │
         │              │ 4. Validates Token
         │              │    Checks "Admins" group
         │              │
         │ 5. Authorized
         ▼
┌─────────────────┐
│  Lambda         │
│  (Admin Ops)    │
└────────┬────────┘
         │
         │ 6. Query Data
         ▼
┌─────────────────┐
│   DynamoDB      │
└─────────────────┘
```

## Optional: Disable Authentication

If you want to disable authentication:

1. Remove Cognito variables from `.env`
2. The "Admin" button will not appear
3. Admin endpoints will return 401 Unauthorized

The public submission endpoint will continue to work without authentication.

## Next Steps

- Set up email verification templates in Cognito
- Configure custom domain for Cognito hosted UI (optional)
- Add password reset functionality
- Implement MFA for additional security
- Create additional user groups (e.g., "Managers", "Viewers")
