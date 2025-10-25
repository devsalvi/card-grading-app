# Social Login Setup Guide

This guide explains how to configure Google and Facebook login for the Card Grading App.

## Overview

The app now supports signing in with:
- ✅ Google
- ✅ Facebook
- ✅ Email/Password (existing)

User information (name, email, address) is automatically retrieved from the social provider and can be used to auto-populate the submission form.

## Prerequisites

1. AWS account with deployed Card Grading App backend
2. Google account for Google OAuth setup
3. Facebook account for Facebook OAuth setup

## Part 1: Deploy Backend Changes

First, deploy the updated backend with social login support:

```bash
sam build && sam deploy --resolve-s3
```

After deployment, note these outputs:
- `UserPoolId`
- `UserPoolClientId`
- `UserPoolDomain`
- `HostedUIUrl`

## Part 2: Configure Google OAuth

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Card Grading App"
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://card-grading-ACCOUNT_ID.auth.us-east-1.amazoncognito.com`
   - Authorized redirect URIs:
     - `http://localhost:5173`
     - `https://card-grading-ACCOUNT_ID.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
   - Click "Create"

5. Copy your credentials:
   - **Client ID**: `123456789-abc123.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxx`

### Step 2: Add Google Provider to Cognito

Run this AWS CLI command (replace placeholders):

```bash
USER_POOL_ID="us-east-1_zHIFesZkh"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

aws cognito-idp create-identity-provider \
  --user-pool-id $USER_POOL_ID \
  --provider-name Google \
  --provider-type Google \
  --provider-details \
    client_id=$GOOGLE_CLIENT_ID,client_secret=$GOOGLE_CLIENT_SECRET,authorize_scopes="profile email openid" \
  --attribute-mapping \
    email=email,name=name,username=sub
```

## Part 3: Configure Facebook OAuth

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" as app type
4. Enter app details:
   - App Name: "Card Grading App"
   - App Contact Email: your-email@example.com
5. Click "Create App"

6. In the app dashboard:
   - Go to "Settings" → "Basic"
   - Copy:
     - **App ID**: `1234567890123456`
     - **App Secret**: `abc123def456...` (click "Show")

7. Add Facebook Login product:
   - Click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Select "Web"

8. Configure OAuth Redirect URIs:
   - Go to "Facebook Login" → "Settings"
   - Valid OAuth Redirect URIs:
     - `https://card-grading-ACCOUNT_ID.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`
   - Save changes

9. Make app live:
   - Go to "Settings" → "Basic"
   - Toggle "App Mode" to "Live"

### Step 2: Add Facebook Provider to Cognito

Run this AWS CLI command (replace placeholders):

```bash
USER_POOL_ID="us-east-1_zHIFesZkh"
FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"
FACEBOOK_APP_SECRET="YOUR_FACEBOOK_APP_SECRET"

aws cognito-idp create-identity-provider \
  --user-pool-id $USER_POOL_ID \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details \
    client_id=$FACEBOOK_APP_ID,client_secret=$FACEBOOK_APP_SECRET,authorize_scopes="public_profile,email" \
  --attribute-mapping \
    email=email,name=name,username=id
```

## Part 4: Update Frontend Configuration

Update your `.env` file with the Cognito domain:

```bash
# Existing Cognito config
VITE_COGNITO_USER_POOL_ID=us-east-1_zHIFesZkh
VITE_COGNITO_CLIENT_ID=22qeq1vs1q666m5s88q5oakf9t
VITE_AWS_REGION=us-east-1

# Add Cognito domain for social login
VITE_COGNITO_DOMAIN=card-grading-923849122289
```

Restart your dev server:
```bash
# The server will auto-restart when .env changes
```

## Part 5: Test Social Login

1. Open http://localhost:5173/
2. Click "Admin" button (or sign in to use the form)
3. You should now see:
   - "Sign in with Google" button
   - "Sign in with Facebook" button
   - Traditional email/password form

4. Click a social login button
5. Complete the OAuth flow
6. You'll be redirected back to the app, signed in

## How Auto-Population Works

When a user signs in with a social provider:

1. **User Info Retrieved**: Name, email, and (if available) address from the social profile
2. **Form Auto-Fill**: The submission form automatically populates:
   - Name field
   - Email field
   - Address field (if available from profile)
3. **User Experience**: Users can modify any pre-filled information before submitting

## Attribute Mapping

### Google Attributes
- `email` → User's email address
- `name` → Full name
- `profile` → Profile URL
- `picture` → Profile picture URL

### Facebook Attributes
- `email` → User's email address
- `name` → Full name
- `id` → Facebook user ID

## Troubleshooting

### Error: "Invalid redirect URI"

**Cause**: Redirect URI not configured in Google/Facebook app
**Solution**: Add the Cognito domain redirect URI:
```
https://card-grading-ACCOUNT_ID.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

### Error: "Provider not found"

**Cause**: Identity provider not added to Cognito
**Solution**: Run the `create-identity-provider` AWS CLI command

### Social login button not appearing

**Cause**: Missing `VITE_COGNITO_DOMAIN` in .env
**Solution**: Add the Cognito domain to your .env file

### User info not auto-populating form

**Cause**: User attributes not being read from Cognito
**Solution**: Check that attribute mapping is configured correctly

## Security Notes

1. **Client Secrets**: Never commit Google/Facebook client secrets to git
2. **HTTPS in Production**: Social providers require HTTPS for production URLs
3. **Scopes**: Only request necessary scopes (email, profile, openid)
4. **Token Storage**: Tokens are stored securely by AWS Amplify

## Production Deployment

For production, update:

1. **Google OAuth**:
   - Add production domain to authorized origins
   - Add production Cognito domain redirect URI

2. **Facebook OAuth**:
   - Add production Cognito domain to valid OAuth redirect URIs
   - Ensure app is in "Live" mode

3. **Cognito User Pool Client**:
   - Update CallbackURLs and LogoutURLs in template.yaml
   - Redeploy with `sam deploy`

Example production URLs:
```yaml
CallbackURLs:
  - https://yourdomain.com
  - https://yourdomain.com/
LogoutURLs:
  - https://yourdomain.com
  - https://yourdomain.com/
```

## Quick Setup Script

Save this as `setup-social-login.sh`:

```bash
#!/bin/bash

USER_POOL_ID="us-east-1_zHIFesZkh"

echo "Setting up social login providers..."
echo ""

# Google
read -p "Google Client ID: " GOOGLE_CLIENT_ID
read -s -p "Google Client Secret: " GOOGLE_CLIENT_SECRET
echo ""

if [[ -n "$GOOGLE_CLIENT_ID" && -n "$GOOGLE_CLIENT_SECRET" ]]; then
    echo "Adding Google provider..."
    aws cognito-idp create-identity-provider \
      --user-pool-id $USER_POOL_ID \
      --provider-name Google \
      --provider-type Google \
      --provider-details \
        client_id=$GOOGLE_CLIENT_ID,client_secret=$GOOGLE_CLIENT_SECRET,authorize_scopes="profile email openid" \
      --attribute-mapping \
        email=email,name=name,username=sub
    echo "✓ Google provider added"
fi

echo ""

# Facebook
read -p "Facebook App ID: " FACEBOOK_APP_ID
read -s -p "Facebook App Secret: " FACEBOOK_APP_SECRET
echo ""

if [[ -n "$FACEBOOK_APP_ID" && -n "$FACEBOOK_APP_SECRET" ]]; then
    echo "Adding Facebook provider..."
    aws cognito-idp create-identity-provider \
      --user-pool-id $USER_POOL_ID \
      --provider-name Facebook \
      --provider-type Facebook \
      --provider-details \
        client_id=$FACEBOOK_APP_ID,client_secret=$FACEBOOK_APP_SECRET,authorize_scopes="public_profile,email" \
      --attribute-mapping \
        email=email,name=name,username=id
    echo "✓ Facebook provider added"
fi

echo ""
echo "✓ Social login providers configured!"
echo ""
echo "Don't forget to add VITE_COGNITO_DOMAIN to your .env file:"
echo "VITE_COGNITO_DOMAIN=card-grading-$AWS_ACCOUNT_ID"
```

Make it executable:
```bash
chmod +x setup-social-login.sh
./setup-social-login.sh
```

## Support

For issues with:
- **Google OAuth**: [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- **Facebook OAuth**: [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- **AWS Cognito**: [Cognito Identity Providers Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-identity-federation.html)
