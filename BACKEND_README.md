# Backend Setup - Quick Start

This is a simplified guide to deploy the Card Grading App backend using AWS SAM (Serverless Application Model).

## What Gets Deployed

- **DynamoDB Table**: Stores all card submissions
- **Lambda Function**: Processes API requests
- **API Gateway**: REST API endpoint for frontend
- **IAM Roles**: Automatic permissions setup

## Prerequisites

1. **AWS Account**
2. **AWS CLI** installed and configured:
   ```bash
   aws configure
   ```
3. **AWS SAM CLI** installed:
   ```bash
   # macOS
   brew install aws-sam-cli

   # Windows
   # Download from: https://aws.amazon.com/serverless/sam/
   ```

## One-Command Deployment

### Step 1: Install Lambda Dependencies

```bash
cd lambda/submit-card
npm install
cd ../..
```

### Step 2: Deploy with SAM

```bash
# Deploy the entire stack
sam deploy --guided
```

**Follow the prompts:**
- **Stack Name**: `card-grading-backend`
- **AWS Region**: `us-east-1` (or your preferred region)
- **Confirm changes**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Disable rollback**: N
- **Save arguments to config**: Y

**Wait 3-5 minutes** for deployment to complete.

### Step 3: Get API Endpoint

After deployment completes, SAM will output:

```
Outputs
---------------------------------------------------------------------------------------
Key                 ApiEndpoint
Description         API Gateway endpoint URL
Value               https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
---------------------------------------------------------------------------------------
```

**Copy this URL** - you'll need it for the frontend.

## Step 4: Configure Frontend

### For AWS Amplify (Production)

1. Go to your Amplify app in AWS Console
2. Click **"Environment variables"**
3. Add variable:
   - **Variable**: `VITE_API_ENDPOINT`
   - **Value**: `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`
4. Click **"Save"**
5. **Redeploy** your app

### For Local Development

Create `.env` file in project root:

```bash
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_ENDPOINT=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

Restart dev server:
```bash
npm run dev
```

## Testing

### Test from Command Line

```bash
curl -X POST https://YOUR_API_ENDPOINT/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test123",
    "gradingCompany": "psa",
    "submitterName": "Test User",
    "email": "test@example.com",
    "cards": [
      {
        "cardType": "Sports",
        "playerName": "Test Player",
        "year": "2024",
        "estimatedCondition": "Mint",
        "declaredValue": "100"
      }
    ]
  }'
```

Expected response:
```json
{
  "message": "Submission saved successfully",
  "submissionId": "test123",
  "savedAt": "2024-10-24T12:00:00.000Z"
}
```

### Test from Browser

1. Open your deployed app
2. Upload a card image
3. Fill out the form
4. Click **"Submit for Grading"**
5. Should see success message

### Verify in DynamoDB

```bash
aws dynamodb scan --table-name CardGradingSubmissions
```

## View Submissions

### Get All Submissions

```bash
aws dynamodb scan \
  --table-name CardGradingSubmissions \
  --region us-east-1
```

### Get Single Submission by ID

```bash
aws dynamodb get-item \
  --table-name CardGradingSubmissions \
  --key '{"submissionId": {"S": "1234567890"}}' \
  --region us-east-1
```

### Query by Email

```bash
aws dynamodb query \
  --table-name CardGradingSubmissions \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

## Updating the Backend

### After Code Changes

```bash
# Build and deploy updates
sam build
sam deploy
```

### Update Lambda Function Only

```bash
cd lambda/submit-card
npm install  # If dependencies changed
cd ../..

sam build
sam deploy --no-confirm-changeset
```

## Delete Backend (Cleanup)

To remove all AWS resources:

```bash
sam delete --stack-name card-grading-backend
```

This will delete:
- DynamoDB table and all data
- Lambda function
- API Gateway
- IAM roles

**Warning**: This is permanent and cannot be undone!

## Monitoring

### View Lambda Logs

```bash
# View recent logs
sam logs -n SubmitCardFunction --stack-name card-grading-backend --tail

# Filter logs
sam logs -n SubmitCardFunction --stack-name card-grading-backend --filter "ERROR"
```

### CloudWatch Console

1. Go to https://console.aws.amazon.com/cloudwatch/
2. Click **"Logs"** → **"Log groups"**
3. Find `/aws/lambda/CardGradingSubmitFunction`
4. View execution logs

## Cost Monitoring

### Free Tier Coverage

- **Lambda**: 1M requests/month free
- **DynamoDB**: 25 GB storage, 25 read/write capacity units free
- **API Gateway**: 1M calls/month free (first 12 months)

### Estimated Costs (After Free Tier)

- **Personal use**: $0-5/month
- **Small business**: $10-50/month

### Monitor Costs

```bash
# Get cost estimate
aws ce get-cost-and-usage \
  --time-period Start=2024-10-01,End=2024-10-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --filter file://filter.json
```

## Troubleshooting

### CORS Errors

If you see "CORS policy" errors:

1. Verify API Gateway CORS is enabled (it should be automatic with SAM)
2. Check Lambda returns proper headers
3. Redeploy: `sam deploy`

### Submissions Not Saving

1. **Check Lambda logs**:
   ```bash
   sam logs -n SubmitCardFunction --stack-name card-grading-backend --tail
   ```

2. **Verify table exists**:
   ```bash
   aws dynamodb describe-table --table-name CardGradingSubmissions
   ```

3. **Test Lambda directly**:
   ```bash
   sam local invoke SubmitCardFunction --event events/test-event.json
   ```

### API Not Found (404)

1. Verify API endpoint URL is correct
2. Check deployment stage: `/prod`
3. Redeploy API:
   ```bash
   sam deploy --no-confirm-changeset
   ```

## Security Notes

### Current Setup (Development)

- ✅ HTTPS enabled
- ✅ CORS configured
- ⚠️ No authentication (public API)
- ⚠️ No rate limiting

### Production Recommendations

1. **Add API Key**:
   ```yaml
   CardGradingAPI:
     Type: AWS::Serverless::Api
     Properties:
       Auth:
         ApiKeyRequired: true
   ```

2. **Add AWS Cognito** for user authentication
3. **Enable WAF** for DDoS protection
4. **Add CloudWatch alarms** for errors
5. **Enable CloudTrail** for audit logs

## Next Steps

- [ ] Test submission from deployed app
- [ ] Create admin dashboard to view submissions
- [ ] Add email notifications (AWS SES)
- [ ] Add image upload to S3
- [ ] Implement authentication

---

**Deployment Time**: 5-10 minutes
**Difficulty**: Beginner-friendly with SAM
**Support**: See `DYNAMODB_BACKEND_SETUP.md` for detailed manual setup
