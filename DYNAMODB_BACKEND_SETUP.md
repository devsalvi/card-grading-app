# DynamoDB Backend Setup Guide

This guide explains how to set up the serverless backend for the Card Grading App using AWS Lambda, API Gateway, and DynamoDB.

## Architecture Overview

```
React App → API Gateway → Lambda Function → DynamoDB
```

**Components:**
- **DynamoDB**: NoSQL database storing card submissions
- **Lambda Function**: Serverless function handling API requests
- **API Gateway**: REST API endpoint for the frontend
- **IAM Roles**: Permissions for Lambda to access DynamoDB

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured
- Node.js 18+ installed

## Step 1: Create DynamoDB Table

### Option A: Using AWS Console (Easiest)

1. **Open DynamoDB Console**:
   - Go to https://console.aws.amazon.com/dynamodb/
   - Click **"Create table"**

2. **Configure Table**:
   - **Table name**: `CardGradingSubmissions`
   - **Partition key**: `submissionId` (String)
   - **Table settings**: Use default settings (on-demand)

3. **Add Global Secondary Index (GSI)**:
   - After table creation, go to **"Indexes"** tab
   - Click **"Create index"**
   - **Partition key**: `email` (String)
   - **Sort key**: `submittedAt` (String)
   - **Index name**: `EmailIndex`
   - **Projected attributes**: All

4. **Enable TTL (Optional)**:
   - Go to **"Additional settings"** tab
   - Click **"Edit"** under Time to Live
   - **TTL attribute**: `ttl`
   - This auto-deletes submissions after 90 days

### Option B: Using CloudFormation (Infrastructure as Code)

```bash
# Deploy the DynamoDB table using the CloudFormation template
aws cloudformation create-stack \
  --stack-name card-grading-dynamodb \
  --template-body file://infrastructure/dynamodb-table.yaml \
  --region us-east-1
```

Wait for stack creation:
```bash
aws cloudformation wait stack-create-complete \
  --stack-name card-grading-dynamodb \
  --region us-east-1
```

## Step 2: Create Lambda Function

### 1. Package Lambda Function

```bash
cd lambda/submit-card

# Install dependencies
npm install

# Create deployment package
zip -r function.zip index.js node_modules/
```

### 2. Create IAM Role for Lambda

**Option A: Using AWS Console**

1. Go to https://console.aws.amazon.com/iam/
2. Click **"Roles"** → **"Create role"**
3. **Trusted entity**: AWS service → Lambda
4. **Permissions policies**:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch Logs)
   - Create custom policy for DynamoDB:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/CardGradingSubmissions",
        "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/CardGradingSubmissions/index/EmailIndex"
      ]
    }
  ]
}
```

5. **Role name**: `CardGradingLambdaRole`
6. Click **"Create role"**

**Option B: Using AWS CLI**

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name CardGradingLambdaRole \
  --assume-role-policy-document file://trust-policy.json

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name CardGradingLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create and attach DynamoDB policy
cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/CardGradingSubmissions",
        "arn:aws:dynamodb:us-east-1:*:table/CardGradingSubmissions/index/EmailIndex"
      ]
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name CardGradingLambdaRole \
  --policy-name DynamoDBAccess \
  --policy-document file://dynamodb-policy.json
```

### 3. Create Lambda Function

**Using AWS Console:**

1. Go to https://console.aws.amazon.com/lambda/
2. Click **"Create function"**
3. **Function name**: `CardGradingSubmitFunction`
4. **Runtime**: Node.js 18.x or higher
5. **Execution role**: Use existing role → Select `CardGradingLambdaRole`
6. Click **"Create function"**
7. **Upload code**:
   - Click **"Upload from"** → **".zip file"**
   - Upload `function.zip`
8. **Environment variables**:
   - Key: `DYNAMODB_TABLE_NAME`
   - Value: `CardGradingSubmissions`
9. **Timeout**: Change to 30 seconds (Configuration → General configuration)
10. Click **"Deploy"**

**Using AWS CLI:**

```bash
# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name CardGradingLambdaRole --query 'Role.Arn' --output text)

# Create function
aws lambda create-function \
  --function-name CardGradingSubmitFunction \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --environment Variables={DYNAMODB_TABLE_NAME=CardGradingSubmissions} \
  --region us-east-1
```

## Step 3: Create API Gateway

### Using AWS Console

1. **Create REST API**:
   - Go to https://console.aws.amazon.com/apigateway/
   - Click **"Create API"**
   - Choose **"REST API"** (not private)
   - **API name**: `CardGradingAPI`
   - Click **"Create API"**

2. **Create Resource**:
   - Click **"Actions"** → **"Create Resource"**
   - **Resource name**: `submissions`
   - **Resource path**: `/submissions`
   - **Enable CORS**: Check this box
   - Click **"Create Resource"**

3. **Create POST Method**:
   - Select `/submissions` resource
   - Click **"Actions"** → **"Create Method"**
   - Select **POST** from dropdown
   - **Integration type**: Lambda Function
   - **Lambda Function**: `CardGradingSubmitFunction`
   - **Use Lambda Proxy integration**: Check this box
   - Click **"Save"**
   - Click **"OK"** to grant permissions

4. **Enable CORS** (if not enabled):
   - Select `/submissions` resource
   - Click **"Actions"** → **"Enable CORS"**
   - Keep defaults, click **"Enable CORS and replace existing CORS headers"**

5. **Deploy API**:
   - Click **"Actions"** → **"Deploy API"**
   - **Deployment stage**: [New Stage]
   - **Stage name**: `prod`
   - Click **"Deploy"**
   - **Copy the Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

### Using AWS CLI

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name CardGradingSubmitFunction --query 'Configuration.FunctionArn' --output text)

# Create API
API_ID=$(aws apigateway create-rest-api \
  --name CardGradingAPI \
  --query 'id' \
  --output text)

# Get root resource
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' \
  --output text)

# Create /submissions resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part submissions \
  --query 'id' \
  --output text)

# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Set Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations

# Add Lambda permission
aws lambda add-permission \
  --function-name CardGradingSubmitFunction \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"

# Enable CORS
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --type MOCK \
  --request-templates '{"application/json": "{\"statusCode\": 200}"}'

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

echo "API Endpoint: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

## Step 4: Configure Frontend

### 1. Add API Endpoint to Environment Variables

In Amplify Console:
1. Go to your app in AWS Amplify
2. Click **"Environment variables"**
3. Add variable:
   - **Variable**: `VITE_API_ENDPOINT`
   - **Value**: Your API Gateway URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
4. Click **"Save"**
5. **Redeploy** your app

For local development, create `.env` file:
```bash
VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_ENDPOINT=https://abc123.execute-api.us-east-1.amazonaws.com/prod
```

### 2. Test the Integration

1. Visit your deployed app
2. Upload a card and fill out the form
3. Click **"Submit for Grading"**
4. Check DynamoDB table to verify the submission was saved

## Step 5: Query Submissions (Admin Features)

### Query All Submissions

```bash
aws dynamodb scan \
  --table-name CardGradingSubmissions \
  --region us-east-1
```

### Query by Submission ID

```bash
aws dynamodb get-item \
  --table-name CardGradingSubmissions \
  --key '{"submissionId": {"S": "1234567890"}}' \
  --region us-east-1
```

### Query by Email (Using GSI)

```bash
aws dynamodb query \
  --table-name CardGradingSubmissions \
  --index-name EmailIndex \
  --key-condition-expression "email = :email" \
  --expression-attribute-values '{":email": {"S": "user@example.com"}}' \
  --region us-east-1
```

## Database Schema

### DynamoDB Item Structure

```json
{
  "submissionId": "1729800000000",
  "gradingCompany": "psa",
  "submitterName": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "specialInstructions": "Handle with care",
  "cards": [
    {
      "cardType": "Sports",
      "sport": "Basketball",
      "playerName": "Michael Jordan",
      "year": "1986",
      "manufacturer": "Fleer",
      "cardNumber": "#57",
      "estimatedCondition": "Near Mint",
      "declaredValue": "1500"
    }
  ],
  "submittedAt": "2024-10-24T12:00:00.000Z",
  "status": "pending",
  "totalCards": 1,
  "totalDeclaredValue": 1500,
  "ttl": 1737571200
}
```

### Indexes

**Primary Key:**
- Partition Key: `submissionId` (String)

**Global Secondary Index (EmailIndex):**
- Partition Key: `email` (String)
- Sort Key: `submittedAt` (String)

## Cost Estimates

### DynamoDB (On-Demand)
- **Write**: $1.25 per million write requests
- **Read**: $0.25 per million read requests
- **Storage**: $0.25 per GB/month
- **Estimated**: $1-5/month for personal use

### Lambda
- **Free Tier**: 1M requests/month, 400,000 GB-seconds compute
- **After Free Tier**: $0.20 per 1M requests
- **Estimated**: Free for personal use

### API Gateway
- **Free Tier**: 1M API calls/month (first 12 months)
- **After Free Tier**: $3.50 per million requests
- **Estimated**: Free for personal use

**Total**: ~$0-10/month depending on usage

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. **Verify Lambda returns CORS headers**:
   ```javascript
   const headers = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'Content-Type',
     'Access-Control-Allow-Methods': 'POST,OPTIONS'
   };
   ```

2. **Enable CORS in API Gateway**:
   - Select your API resource
   - Actions → Enable CORS
   - Deploy API

### Lambda Permission Denied

If API Gateway can't invoke Lambda:

```bash
aws lambda add-permission \
  --function-name CardGradingSubmitFunction \
  --statement-id apigateway-test \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com
```

### DynamoDB Access Denied

Verify IAM role has DynamoDB permissions:

```bash
aws iam get-role-policy \
  --role-name CardGradingLambdaRole \
  --policy-name DynamoDBAccess
```

### Submissions Not Appearing in DynamoDB

1. Check Lambda logs in CloudWatch:
   ```bash
   aws logs tail /aws/lambda/CardGradingSubmitFunction --follow
   ```

2. Verify table name matches environment variable

3. Test Lambda directly:
   ```bash
   aws lambda invoke \
     --function-name CardGradingSubmitFunction \
     --payload '{"httpMethod":"POST","body":"{\"submissionId\":\"test123\",\"cards\":[],\"gradingCompany\":\"psa\"}"}' \
     response.json
   ```

## Security Best Practices

1. **API Authentication**: Add API keys or Cognito authentication
2. **Input Validation**: Validate all inputs in Lambda
3. **Rate Limiting**: Configure API Gateway throttling
4. **Encryption**: Enable DynamoDB encryption at rest
5. **CloudTrail**: Enable AWS CloudTrail for audit logs

## Next Steps

- Add authentication (AWS Cognito)
- Create admin dashboard to view submissions
- Add email notifications (SES or SNS)
- Implement submission status updates
- Add image storage (S3 + CloudFront)

---

**Status**: ✅ Production Ready
**Setup Time**: 30-45 minutes
**Support**: See AWS documentation for detailed guides
