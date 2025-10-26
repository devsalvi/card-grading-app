# Fix Google OAuth for Production

## Issue: Google Login Works Locally but Not in Production

If Google social login works at `http://localhost:5173` but fails at `https://main.d1xsxgfyygtbif.amplifyapp.com`, you need to add your production domain to Google OAuth settings.

---

## Quick Fix (5 minutes)

### Step 1: Open Google Cloud Console

Visit: **https://console.cloud.google.com/apis/credentials**

### Step 2: Find Your OAuth Client

Look for the OAuth 2.0 Client ID:
- **Client ID**: `400895105443-spar8akr5mmibh31eno41dv12i4isbik.apps.googleusercontent.com`

Click on it to edit.

### Step 3: Add Production Domain

You need to add TWO things:

#### A. Authorized JavaScript Origins

In the **"Authorized JavaScript origins"** section, click **"ADD URI"** and add:

```
https://main.d1xsxgfyygtbif.amplifyapp.com
```

**Important**:
- ✅ Must start with `https://`
- ✅ No trailing slash
- ✅ Must match your production domain exactly

#### B. Verify Authorized Redirect URIs

In the **"Authorized redirect URIs"** section, make sure you have:

```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

This should already be there (since local works), but verify it's present.

### Step 4: Save Changes

Click **"Save"** at the bottom of the page.

### Step 5: Wait 5-10 Minutes

Google OAuth changes take a few minutes to propagate globally.

### Step 6: Clear Browser Cache

Before testing:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or open an incognito/private browsing window.

---

## Why This Happens

### OAuth Security Model

Google OAuth has two security checks:

1. **JavaScript Origin** - Where the OAuth request originates
   - Local: `http://localhost:5173` ✅
   - Production: `https://main.d1xsxgfyygtbif.amplifyapp.com` ❌ (needs to be added)

2. **Redirect URI** - Where OAuth sends the user after login
   - Always: `https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` ✅

### Why Local Works

When testing locally, you've already added:
- Origin: `http://localhost:5173` ✅
- Redirect: Cognito callback URL ✅

### Why Production Doesn't Work

Production domain isn't in authorized origins:
- Origin: `https://main.d1xsxgfyygtbif.amplifyapp.com` ❌ (missing)

---

## OAuth Flow Diagram

```
User on Production Site
https://main.d1xsxgfyygtbif.amplifyapp.com
│
├─ Click "Sign in with Google"
│
├─ Browser checks: Is this origin authorized in Google OAuth?
│  ├─ If NO → ERROR: origin_mismatch or blocked popup
│  └─ If YES → Continue ✅
│
├─ Redirect to Google
│  accounts.google.com/o/oauth2/v2/auth
│  ?client_id=400895105443-...
│  &redirect_uri=https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
│  &origin=https://main.d1xsxgfyygtbif.amplifyapp.com  ← Must be authorized!
│
├─ User logs in with Google
│
├─ Google checks: Is this redirect_uri authorized?
│  ├─ If NO → ERROR: redirect_uri_mismatch
│  └─ If YES → Continue ✅
│
├─ Redirect to Cognito
│  https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
│  ?code=AUTH_CODE
│
├─ Cognito exchanges code for tokens
│
└─ Redirect back to production
   https://main.d1xsxgfyygtbif.amplifyapp.com
   ✅ Signed in successfully!
```

---

## Common Errors and Solutions

### Error: "origin_mismatch"

**Cause**: Production domain not in Authorized JavaScript origins

**Solution**: Add `https://main.d1xsxgfyygtbif.amplifyapp.com` to Authorized JavaScript origins

### Error: "redirect_uri_mismatch"

**Cause**: Cognito callback URL not in Authorized redirect URIs

**Solution**: Add `https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` to Authorized redirect URIs

### Error: "Popup blocked" or silent failure

**Cause**: CORS or origin issues

**Solution**:
1. Add production domain to Authorized JavaScript origins
2. Clear browser cache
3. Try incognito mode

### Error: Works in incognito but not regular browser

**Cause**: Browser cache or cookies

**Solution**: Clear browser cache and cookies for your domain

---

## Verify Your Configuration

### Your Google OAuth Client Should Have:

**Authorized JavaScript origins**:
```
http://localhost:5173
https://main.d1xsxgfyygtbif.amplifyapp.com
```

**Authorized redirect URIs**:
```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

**DO NOT ADD** (these are handled by Cognito):
```
❌ http://localhost:5173/  (your app URLs)
❌ https://main.d1xsxgfyygtbif.amplifyapp.com/  (your app URLs)
```

---

## Test in Production

After adding the production origin and waiting:

1. **Open production**: https://main.d1xsxgfyygtbif.amplifyapp.com

2. **Open browser DevTools** (F12)

3. **Click "Sign in with Google"**

4. **Watch for**:
   - Should redirect to Google without errors
   - Should show Google login screen
   - Should redirect back to your app
   - Should show signed in state

5. **Check Console** for any errors

---

## Debug Production Issues

### Enable Verbose Logging

In your browser console, before clicking "Sign in with Google":

```javascript
// Enable verbose logging
localStorage.setItem('debug', 'aws-amplify:*');

// Then click "Sign in with Google"
```

### Check Network Tab

1. Open DevTools → Network tab
2. Click "Sign in with Google"
3. Look for the redirect to `accounts.google.com`
4. Check the `origin` parameter in the URL
5. Verify it matches: `https://main.d1xsxgfyygtbif.amplifyapp.com`

### Common Console Errors

**"Failed to initialize OAuth"**
- Check VITE_COGNITO_DOMAIN is set in Amplify env vars

**"Provider not supported"**
- Check Google is in SupportedIdentityProviders (we verified it is ✅)

**"Cross-origin request blocked"**
- Add production domain to Google OAuth JavaScript origins

---

## Amplify Environment Variables

Verify these are set in Amplify Console:

```bash
VITE_API_ENDPOINT=https://kt62i1wkyh.execute-api.us-east-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-east-1_zHIFesZkh
VITE_COGNITO_CLIENT_ID=22qeq1vs1q666m5s88q5oakf9t
VITE_AWS_REGION=us-east-1
VITE_COGNITO_DOMAIN=card-grading-923849122289
```

To check:
1. Go to Amplify Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d1xsxgfyygtbif
2. Click "Environment variables"
3. Verify all values match above

---

## Summary

**Issue**: Google login works locally but not in production

**Root Cause**: Production domain not in Google OAuth authorized JavaScript origins

**Solution**:
1. Add `https://main.d1xsxgfyygtbif.amplifyapp.com` to Google OAuth Authorized JavaScript origins
2. Verify Cognito callback URL is in Authorized redirect URIs
3. Save and wait 5-10 minutes
4. Test in incognito mode

**Time**: 5 minutes + 5-10 minutes propagation

✅ After this, Google login will work in production!

---

## Quick Commands to Verify Setup

### Check Cognito Configuration
```bash
# Verify callback URLs include production
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t \
  --query 'UserPoolClient.CallbackURLs'

# Verify Google provider is enabled
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_zHIFesZkh \
  --client-id 22qeq1vs1q666m5s88q5oakf9t \
  --query 'UserPoolClient.SupportedIdentityProviders'
```

### Check Google Provider Details
```bash
aws cognito-idp describe-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Google \
  --query 'IdentityProvider.ProviderDetails.client_id'
```

All these should return valid data (and they do! ✅)

The only missing piece is the production domain in Google OAuth settings.
