# Social Login Setup Guide (Google & Facebook)

This guide walks you through setting up Google and Facebook OAuth authentication for your card grading app.

## Prerequisites

- ✅ AWS Cognito User Pool created
- ✅ Production app deployed on Amplify
- ✅ Callback URLs configured (localhost + production)

## Current Status

**Callback URLs Configured**:
- ✅ `http://localhost:5173` (local development)
- ✅ `http://localhost:5173/`
- ✅ `https://main.d1xsxgfyygtbif.amplifyapp.com` (production)
- ✅ `https://main.d1xsxgfyygtbif.amplifyapp.com/`

**What's Missing**: Google and Facebook identity providers need to be configured in Cognito.

---

## Part 1: Set Up Google OAuth

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing):
   - Click project dropdown at the top
   - Click "New Project"
   - Name: `Card Grading App`
   - Click "Create"

3. **Enable Google+ API**:
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google+ API"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Choose "External" (for public users) or "Internal" (for organization only)
   - Click "Create"
   - Fill in required fields:
     - **App name**: `Card Grading App`
     - **User support email**: Your email
     - **Developer contact email**: Your email
   - Click "Save and Continue"
   - **Scopes**: Click "Add or Remove Scopes"
     - Select: `email`, `profile`, `openid`
     - Click "Update"
   - Click "Save and Continue"
   - **Test users** (if External): Add your email for testing
   - Click "Save and Continue"

5. **Create OAuth Client ID**:
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - **Application type**: Web application
   - **Name**: `Card Grading Web Client`
   - **Authorized redirect URIs**: Add these URLs:
     ```
     https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
   - Click "Create"
   - **Save these values**:
     - Client ID (looks like: `123456789-abc123.apps.googleusercontent.com`)
     - Client Secret

### Step 2: Add Google Provider to Cognito

```bash
# Set your Google credentials
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# Create Google identity provider in Cognito
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Google \
  --provider-type Google \
  --provider-details client_id=$GOOGLE_CLIENT_ID,client_secret=$GOOGLE_CLIENT_SECRET,authorize_scopes="email openid profile" \
  --attribute-mapping email=email,name=name,username=sub
```

### Step 3: Enable Google in User Pool Client

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t \
  --supported-identity-providers "COGNITO" "Google" \
  --callback-urls "http://localhost:5173" "http://localhost:5173/" "https://main.d1xsxgfyygtbif.amplifyapp.com" "https://main.d1xsxgfyygtbif.amplifyapp.com/" \
  --logout-urls "http://localhost:5173" "http://localhost:5173/" "https://main.d1xsxgfyygtbif.amplifyapp.com" "https://main.d1xsxgfyygtbif.amplifyapp.com/" \
  --allowed-o-auth-flows "code" "implicit" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client
```

---

## Part 2: Set Up Facebook OAuth

### Step 1: Create Facebook App

1. **Go to Facebook Developers**:
   - Visit: https://developers.facebook.com/
   - Log in with your Facebook account

2. **Create a New App**:
   - Click "Create App"
   - Choose "Consumer" as app type
   - Click "Next"
   - Fill in:
     - **App name**: `Card Grading App`
     - **App contact email**: Your email
   - Click "Create App"

3. **Add Facebook Login Product**:
   - In the app dashboard, click "Add Product"
   - Find "Facebook Login" and click "Set Up"
   - Choose "Web" as platform
   - **Site URL**: `https://main.d1xsxgfyygtbif.amplifyapp.com`
   - Click "Save"

4. **Configure Facebook Login Settings**:
   - Go to "Facebook Login" → "Settings" in left sidebar
   - **Valid OAuth Redirect URIs**: Add this URL:
     ```
     https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
   - Click "Save Changes"

5. **Get App Credentials**:
   - Go to "Settings" → "Basic" in left sidebar
   - **Save these values**:
     - App ID
     - App Secret (click "Show" to reveal)

6. **Make App Public** (for production):
   - Go to "Settings" → "Basic"
   - Scroll down and toggle "App Mode" from "Development" to "Live"
   - Confirm the change

### Step 2: Add Facebook Provider to Cognito

```bash
# Set your Facebook credentials
FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"
FACEBOOK_APP_SECRET="YOUR_FACEBOOK_APP_SECRET"

# Create Facebook identity provider in Cognito
aws cognito-idp create-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Facebook \
  --provider-type Facebook \
  --provider-details client_id=$FACEBOOK_APP_ID,client_secret=$FACEBOOK_APP_SECRET,authorize_scopes="email,public_profile" \
  --attribute-mapping email=email,name=name,username=id
```

### Step 3: Enable Facebook in User Pool Client

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t \
  --supported-identity-providers "COGNITO" "Google" "Facebook" \
  --callback-urls "http://localhost:5173" "http://localhost:5173/" "https://main.d1xsxgfyygtbif.amplifyapp.com" "https://main.d1xsxgfyygtbif.amplifyapp.com/" \
  --logout-urls "http://localhost:5173" "http://localhost:5173/" "https://main.d1xsxgfyygtbif.amplifyapp.com" "https://main.d1xsxgfyygtbif.amplifyapp.com/" \
  --allowed-o-auth-flows "code" "implicit" \
  --allowed-o-auth-scopes "email" "openid" "profile" \
  --allowed-o-auth-flows-user-pool-client
```

---

## Part 3: Verify Setup

### Check Configured Providers

```bash
# List all identity providers
aws cognito-idp list-identity-providers \
  --user-pool-id us-east-1_zHIFesZkh \
  --query 'Providers[].ProviderName' \
  --output table

# Check user pool client configuration
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t \
  --query 'UserPoolClient.SupportedIdentityProviders' \
  --output table
```

Expected output:
```
-----------------------
|  ListIdentityProviders  |
+-----------+
|  Google   |
|  Facebook |
+-----------+
```

---

## Part 4: Test Social Login

### Test Locally

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open**: http://localhost:5173

3. **Click "Sign in with Google"** or **"Sign in with Facebook"**

4. **Expected flow**:
   - Redirects to Google/Facebook login
   - You log in with your Google/Facebook account
   - Redirects back to your app at `http://localhost:5173`
   - You're now signed in!

### Test in Production

1. **Open**: https://main.d1xsxgfyygtbif.amplifyapp.com

2. **Click social login button**

3. **Expected flow**:
   - Redirects to provider
   - Log in
   - Redirects back to `https://main.d1xsxgfyygtbif.amplifyapp.com`
   - Signed in successfully!

---

## Part 5: Update Frontend Code (Optional Enhancements)

The social login buttons are already implemented in your app! But if you want to customize them, here's where to look:

**Main social login component**: `src/components/SocialLoginButton.jsx`
**Auth service**: `src/services/authService.js`

The `signInWithSocial(provider)` function handles the OAuth flow:

```javascript
// Example usage in your components:
import { signInWithSocial } from '../services/authService';

// Sign in with Google
await signInWithSocial('Google');

// Sign in with Facebook
await signInWithSocial('Facebook');
```

---

## Troubleshooting

### Issue: "Login option is not available"

**Cause**: Identity provider not configured in Cognito

**Solution**: Make sure you completed Part 1 or Part 2 above

### Issue: "Invalid redirect URI"

**Cause**: Mismatch between OAuth provider redirect URI and Cognito redirect URI

**Solution**:
1. Check Google/Facebook OAuth settings
2. Ensure redirect URI is exactly:
   ```
   https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```

### Issue: "Access denied" after OAuth flow

**Cause**: Missing required scopes or attribute mapping

**Solution**:
- **Google**: Ensure scopes include `email`, `openid`, `profile`
- **Facebook**: Ensure scopes include `email`, `public_profile`
- Check attribute mapping in Cognito identity provider

### Issue: Social login works locally but not in production

**Cause**: Production URL not in callback URLs

**Solution**: Already fixed! Both localhost and production URLs are configured.

### Issue: Facebook login shows "App Not Set Up"

**Cause**: Facebook app is in Development mode

**Solution**: Switch app to "Live" mode in Facebook App settings

---

## Quick Reference Commands

```bash
# List all identity providers
aws cognito-idp list-identity-providers \
  --user-pool-id us-east-1_zHIFesZkh

# Get user pool client details
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t

# Delete an identity provider (if you need to recreate it)
aws cognito-idp delete-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Google

# Update identity provider
aws cognito-idp update-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Google \
  --provider-details client_id=NEW_ID,client_secret=NEW_SECRET,authorize_scopes="email openid profile"
```

---

## Environment Variables

Your `.env` file should have:

```bash
VITE_API_ENDPOINT=https://kt62i1wkyh.execute-api.us-east-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-east-1_zHIFesZkh
VITE_COGNITO_CLIENT_ID=22qeq1vs1q666m5s88q5oakf9t
VITE_AWS_REGION=us-east-1
VITE_COGNITO_DOMAIN=card-grading-923849122289
```

The `VITE_COGNITO_DOMAIN` enables social login in your app!

---

## Summary

**What's Done**:
- ✅ Callback URLs configured for local and production
- ✅ OAuth flows enabled (code and implicit)
- ✅ OAuth scopes configured (email, openid, profile)
- ✅ Frontend code ready for social login

**What You Need to Do**:
1. ⏳ Set up Google OAuth credentials (Part 1)
2. ⏳ Set up Facebook OAuth credentials (Part 2)
3. ⏳ Add providers to Cognito with AWS CLI
4. ✅ Test in local and production

**Estimated Time**: 15-20 minutes per provider

Once you complete these steps, social login will work in both local development and production! 🎉
