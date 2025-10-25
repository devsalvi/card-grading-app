# AWS Deployment Guide

This guide walks you through deploying the Card Grading App to AWS using **AWS Amplify**, the easiest and most cost-effective way to host React applications.

## Why AWS Amplify?

- **Easy Setup**: Deploy in minutes with minimal configuration
- **Free Tier**: Generous free tier (1000 build minutes/month, 5GB storage, 15GB bandwidth)
- **Auto HTTPS**: Automatic SSL certificate and HTTPS
- **CI/CD**: Automatic deployments on git push
- **Environment Variables**: Secure API key management
- **Custom Domains**: Easy domain setup (optional)
- **Global CDN**: Fast content delivery worldwide

## Prerequisites

1. **AWS Account**: Create a free account at [aws.amazon.com](https://aws.amazon.com)
2. **GitHub Account**: Push your code to GitHub (or use GitLab/Bitbucket)
3. **Google Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Deployment Options

### Option 1: Deploy via GitHub (Recommended)

This method enables automatic deployments whenever you push code changes.

#### Step 1: Push Code to GitHub

1. **Create a new GitHub repository**:
   ```bash
   # Go to github.com and create a new repository named "card-grading-app"
   # Do NOT initialize with README (we already have one)
   ```

2. **Push your local code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/card-grading-app.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username.

3. **Verify**: Visit your GitHub repository to confirm all files are uploaded

#### Step 2: Deploy with AWS Amplify

1. **Open AWS Amplify Console**:
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Search for "Amplify" in the services search bar
   - Click "AWS Amplify"

2. **Start New App**:
   - Click **"New app"** → **"Host web app"**
   - Choose **"GitHub"** as your git provider
   - Click **"Continue"**

3. **Authorize GitHub**:
   - Click **"Authorize AWS Amplify"**
   - Sign in to GitHub if prompted
   - Grant Amplify access to your repositories

4. **Select Repository**:
   - **Repository**: Select `card-grading-app`
   - **Branch**: Select `main`
   - Click **"Next"**

5. **Configure Build Settings**:
   - **App name**: `card-grading-app` (or customize)
   - Amplify will auto-detect the build settings from `amplify.yml`
   - Verify the build settings look like this:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: dist
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
     ```
   - Click **"Next"**

6. **Review and Deploy**:
   - Review all settings
   - Click **"Save and deploy"**
   - Wait 3-5 minutes for the first deployment to complete

#### Step 3: Add Environment Variables (Google Gemini API Key)

**IMPORTANT**: You must add your Google Gemini API key as an environment variable for the AI analysis feature to work.

1. **In the Amplify Console**, click on your app
2. Click **"Environment variables"** in the left sidebar
3. Click **"Manage variables"**
4. Add a new variable:
   - **Variable name**: `VITE_GOOGLE_GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key (get from [Google AI Studio](https://aistudio.google.com/app/apikey))
5. Click **"Save"**
6. **Redeploy**: Click **"Redeploy this version"** to apply the environment variable

#### Step 4: Access Your App

1. Once deployment completes, you'll see a URL like:
   ```
   https://main.d1a2b3c4d5e6f7.amplifyapp.com
   ```

2. Click the URL to visit your live app!

3. Test the AI card analysis feature to verify the API key works

#### Step 5: Set Up Custom Domain (Optional)

1. In Amplify Console, click **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain name (e.g., `mycardgrading.com`)
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning (5-10 minutes)

---

### Option 2: Manual Deploy (No Git Required)

If you prefer not to use GitHub, you can manually deploy a ZIP file.

#### Step 1: Build the Application Locally

```bash
# Build the production bundle
npm run build
```

This creates a `dist/` folder with optimized static files.

#### Step 2: Deploy to AWS Amplify

1. Open [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Deploy without Git provider"**
3. **App name**: Enter `card-grading-app`
4. **Environment name**: Enter `production`
5. **Method**: Choose "Drag and drop"
6. **Drag the `dist` folder** into the upload area (or ZIP it first)
7. Click **"Save and deploy"**

#### Step 3: Add Environment Variables

Follow the same steps as Option 1, Step 3 to add your `VITE_GOOGLE_GEMINI_API_KEY`.

**NOTE**: Manual deployments require re-uploading the `dist` folder for every update. GitHub integration is recommended for automatic deployments.

---

### Option 3: Deploy to S3 + CloudFront (Advanced)

For more control and potentially lower costs at scale, deploy to S3 with CloudFront CDN.

#### Step 1: Build the Application

```bash
npm run build
```

#### Step 2: Create S3 Bucket

1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. Click **"Create bucket"**
3. **Bucket name**: `card-grading-app-YOUR-NAME` (must be globally unique)
4. **Region**: Choose your preferred region (e.g., `us-east-1`)
5. **Uncheck** "Block all public access"
6. Acknowledge the warning
7. Click **"Create bucket"**

#### Step 3: Upload Files to S3

```bash
# Install AWS CLI if not already installed
# macOS: brew install awscli
# Windows: Download from aws.amazon.com/cli

# Configure AWS CLI with your credentials
aws configure

# Upload files to S3
aws s3 sync dist/ s3://card-grading-app-YOUR-NAME --delete
```

#### Step 4: Enable Static Website Hosting

1. Go to your S3 bucket in the AWS Console
2. Click **"Properties"** tab
3. Scroll to **"Static website hosting"**
4. Click **"Edit"**
5. Enable static website hosting
6. **Index document**: `index.html`
7. **Error document**: `index.html` (for React routing)
8. Click **"Save changes"**

#### Step 5: Set Bucket Policy (Make Public)

1. Click **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

5. Click **"Save changes"**

#### Step 6: Create CloudFront Distribution

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click **"Create distribution"**
3. **Origin domain**: Select your S3 bucket
4. **Origin access**: Choose "Origin access control settings"
5. Create new OAC (Origin Access Control)
6. **Default cache behavior**: Leave defaults
7. **Viewer protocol policy**: "Redirect HTTP to HTTPS"
8. **Price class**: Choose based on your needs (default is fine)
9. **Alternate domain name (CNAME)**: Add your custom domain if you have one
10. **SSL Certificate**: Request or import SSL certificate for custom domain
11. Click **"Create distribution"**
12. Wait 10-15 minutes for distribution to deploy globally

#### Step 7: Update S3 Bucket Policy for CloudFront

CloudFront will provide a bucket policy to update. Copy and paste it into your S3 bucket policy.

#### Step 8: Test Your Deployment

Visit your CloudFront distribution URL (e.g., `https://d111111abcdef8.cloudfront.net`) to access your app.

**Environment Variables**: S3+CloudFront doesn't support environment variables. You must build the app with the API key embedded:

```bash
# Create .env.production file
echo "VITE_GOOGLE_GEMINI_API_KEY=your_api_key_here" > .env.production

# Build with production env vars
npm run build
```

**Security Note**: Embedding API keys in frontend code is not ideal for production. Consider adding backend API proxy for better security.

---

## Post-Deployment Configuration

### 1. Test Your Live App

1. Visit your Amplify/CloudFront URL
2. Upload a card image
3. Click "Analyze All Cards with AI"
4. Verify the AI analysis works (confirms API key is set correctly)
5. Submit a card and check the summary page

### 2. Monitor Your App

**AWS Amplify**:
- View build logs in Amplify Console
- Monitor traffic and errors in "Monitoring" tab
- Set up custom alarms for failures

**CloudFront**:
- View CloudFront metrics in the AWS Console
- Enable CloudWatch logs for detailed analytics
- Set up billing alerts to avoid unexpected costs

### 3. Enable Custom Domain (Optional)

**For Amplify**:
1. Click "Domain management" in Amplify Console
2. Add your domain (e.g., `cardgrading.com`)
3. Update DNS records with your domain provider
4. Amplify auto-provisions SSL certificate

**For CloudFront**:
1. Request SSL certificate in AWS Certificate Manager (us-east-1 region)
2. Add CNAME records to your DNS
3. Update CloudFront distribution with your domain
4. Wait for DNS propagation (10-60 minutes)

---

## Cost Estimates

### AWS Amplify (Recommended)

**Free Tier (First 12 months)**:
- 1,000 build minutes/month
- 5 GB storage
- 15 GB data transfer out/month

**After Free Tier**:
- Build minutes: $0.01/minute
- Hosting: $0.15/GB stored + $0.15/GB served
- Estimated cost: **$0-5/month** for personal use

### S3 + CloudFront

**Free Tier (First 12 months)**:
- 5 GB S3 storage
- 20,000 GET requests
- 50 GB CloudFront data transfer

**After Free Tier**:
- S3: $0.023/GB/month
- CloudFront: $0.085/GB (first 10TB)
- Estimated cost: **$1-10/month** depending on traffic

---

## Troubleshooting

### Build Fails on Amplify

**Error**: `Module not found` or `Cannot find package`
- **Solution**: Ensure `package.json` includes all dependencies
- Run `npm install` locally to verify
- Check build logs in Amplify Console for specific errors

**Error**: `Build failed with exit code 1`
- **Solution**: Check for ESLint errors or TypeScript issues
- Run `npm run build` locally to reproduce the error
- Fix code issues and push to GitHub

### AI Analysis Not Working

**Symptom**: "Failed to analyze card" error
- **Solution**: Verify `VITE_GOOGLE_GEMINI_API_KEY` is set in Amplify environment variables
- Redeploy after adding environment variables
- Check Google AI Studio quota limits

### White Screen / Blank Page

**Solution**: Ensure `amplify.yml` has correct `baseDirectory: dist`
- Vite builds to `dist/`, not `build/`
- Verify in Amplify build settings

### CORS Errors

**Solution**: Gemini API doesn't have CORS restrictions. If you see CORS errors, verify your API key is valid and quota limits aren't exceeded.

---

## Security Best Practices

1. **Never commit `.env` file**: Already in `.gitignore`
2. **Use Amplify environment variables**: Keeps API keys secure
3. **Enable AWS CloudTrail**: Monitor AWS account activity
4. **Set up billing alerts**: Avoid unexpected charges
5. **Use IAM roles**: Grant minimum necessary permissions
6. **Enable CloudWatch logging**: Track errors and usage

---

## Updating Your App

### With GitHub (Automatic)

1. Make code changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```
3. Amplify automatically detects the push and rebuilds
4. Monitor deployment in Amplify Console (2-5 minutes)

### Manual Deploy

1. Build locally: `npm run build`
2. Upload new `dist/` folder to Amplify or S3
3. Invalidate CloudFront cache if using CloudFront:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```

---

## Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [AWS Free Tier Details](https://aws.amazon.com/free/)

---

## Quick Reference Commands

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Push to GitHub
git add .
git commit -m "Your commit message"
git push origin main

# Upload to S3 (if using S3+CloudFront)
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

**Status**: ✅ Ready to Deploy
**Estimated Setup Time**: 10-15 minutes (Amplify) | 30-45 minutes (S3+CloudFront)
**Recommended**: AWS Amplify for easiest setup and automatic deployments
