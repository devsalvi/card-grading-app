# Fix Google OAuth Redirect URI Mismatch

## Error: redirect_uri_mismatch

This error occurs when the redirect URI sent to Google doesn't match what's configured in your Google Cloud Console.

---

## Quick Fix (5 minutes)

### 1. Open Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials

**Make sure you're in the correct project!**

### 2. Find Your OAuth Client

Look for the OAuth 2.0 Client ID with:
- **Client ID**: `400895105443-spar8akr5mmibh31eno41dv12i4isbik.apps.googleusercontent.com`

Click on it to edit the configuration.

### 3. Add Cognito Redirect URI

In the **"Authorized redirect URIs"** section:

**Add this exact URL**:
```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

**IMPORTANT**:
- ✅ Copy it exactly as shown
- ✅ Must start with `https://`
- ✅ Must end with `/oauth2/idpresponse`
- ✅ No spaces, no trailing slashes
- ✅ Case-sensitive

### 4. Save Changes

Click **"Save"** at the bottom of the page.

### 5. Wait 5-10 Minutes

Google OAuth changes take a few minutes to propagate globally. Be patient!

---

## Why This Happens

### How OAuth Flow Works:

1. User clicks "Sign in with Google" on your app
2. Your app redirects to Google with these parameters:
   ```
   client_id=YOUR_GOOGLE_CLIENT_ID
   redirect_uri=https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   scope=email openid profile
   response_type=code
   ```

3. Google checks: "Is this redirect_uri allowed for this client_id?"
4. If NOT in the allowed list → **Error 400: redirect_uri_mismatch** ❌
5. If YES in the allowed list → Proceed with login ✅

### The Cognito URL Explained:

```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
│                                                                       │
│                                                                       └─ OAuth callback endpoint
└─ Your Cognito User Pool Domain
```

This is your **Cognito User Pool's OAuth callback endpoint**. After Google authenticates the user, it redirects here with an authorization code. Then Cognito exchanges it for tokens and redirects to your app.

---

## Verify Your Configuration

### Check What's Currently Configured

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth Client ID
3. Look at **"Authorized redirect URIs"**

### Should Include:

```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

If it's not there, that's why you're getting the error!

---

## Test After Adding URI

### Test Locally

1. **Wait 5-10 minutes** after saving (Google propagation time)

2. **Open your app**:
   ```
   http://localhost:5173
   ```

3. **Click "Sign in with Google"**

4. **Expected flow**:
   - Redirects to Google login
   - You log in
   - Redirects to Cognito
   - Cognito processes the code
   - Redirects back to your app at `http://localhost:5173`
   - ✅ Success! You're signed in

### Test in Production

Same flow should work at:
```
https://main.d1xsxgfyygtbif.amplifyapp.com
```

---

## Common Mistakes

### ❌ Wrong: Adding Your App URLs

**DON'T ADD THESE** (they won't work):
```
http://localhost:5173              ❌ WRONG
https://main.d1xsxgfyygtbif.amplifyapp.com  ❌ WRONG
```

These are handled by Cognito's callback URLs, not Google's authorized redirect URIs.

### ✅ Right: Adding Cognito URL

**DO ADD THIS** (only this):
```
https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse  ✅ CORRECT
```

---

## Architecture Diagram

```
┌─────────────┐
│  Your App   │  http://localhost:5173
│             │  or
│             │  https://main.d1xsxgfyygtbif.amplifyapp.com
└──────┬──────┘
       │ 1. Click "Sign in with Google"
       ↓
┌─────────────┐
│   Google    │  accounts.google.com/o/oauth2/v2/auth
│   OAuth     │
└──────┬──────┘
       │ 2. User logs in
       ↓
┌─────────────┐
│   Cognito   │  card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
│   Callback  │  ← THIS MUST BE IN GOOGLE'S AUTHORIZED REDIRECT URIs
└──────┬──────┘
       │ 3. Exchange code for tokens
       ↓
┌─────────────┐
│  Your App   │  Redirected back with auth session
│  (Signed In)│
└─────────────┘
```

---

## Troubleshooting

### Still Getting Error After Adding URI?

1. **Wait longer** - Can take up to 15 minutes for Google to propagate
2. **Clear browser cache** - Old OAuth responses might be cached
3. **Check for typos** - Copy-paste the URI exactly as shown
4. **Verify you're in the right Google project** - Make sure client IDs match

### Check Google Project

Run this command to verify your Google OAuth configuration:

```bash
aws cognito-idp describe-identity-provider \
  --user-pool-id us-east-1_zHIFesZkh \
  --provider-name Google \
  --query 'IdentityProvider.ProviderDetails.client_id' \
  --output text
```

Output should be:
```
400895105443-spar8akr5mmibh31eno41dv12i4isbik.apps.googleusercontent.com
```

Go to Google Cloud Console and make sure you're configuring the OAuth client with this ID.

---

## Need Help?

If you're still stuck:

1. **Screenshot** your Google OAuth client configuration (Authorized redirect URIs section)
2. **Check browser DevTools** → Network tab → Look for the redirect to Google
3. **Copy the error message** exactly
4. **Verify** the client_id in the error matches your Google OAuth client

---

## Summary

**Problem**: Google OAuth redirect_uri_mismatch
**Cause**: Cognito callback URL not in Google's authorized redirect URIs
**Solution**: Add `https://card-grading-923849122289.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` to Google OAuth settings
**Time**: 5 minutes + 5-10 min propagation

✅ After adding and waiting, Google login will work!
