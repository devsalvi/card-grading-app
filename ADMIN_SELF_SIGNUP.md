# Admin Self-Service Signup Guide

## Overview

Admins can now sign up for their company-specific admin access without requiring manual user creation via AWS CLI. The system uses secure company codes to verify that users are authorized admins for their respective grading companies.

## How It Works

1. **User signs up** at the admin portal (`/admin`)
2. **Selects their company** from the dropdown (PSA, BGS, SGC, CGC, or Super Admin)
3. **Enters the admin code** for their company
4. **Confirms their email** as usual
5. **Post-confirmation trigger** automatically adds them to the correct admin group if the code is valid

## Admin Codes

Each grading company has a unique secure code. These codes are stored in the Lambda function environment variables and should be kept confidential.

### Current Admin Codes

**IMPORTANT:** Share these codes only with authorized admin users for each company.

- **PSA**: `PSA-SECURE-2024`
- **BGS**: `BGS-SECURE-2024`
- **SGC**: `SGC-SECURE-2024`
- **CGC**: `CGC-SECURE-2024`
- **Super Admin**: `SUPER-SECURE-2024`

### Changing Admin Codes

To update admin codes for security:

1. Update the environment variables in `template.yaml`:
   ```yaml
   PostConfirmationFunction:
     Environment:
       Variables:
         PSA_ADMIN_CODE: YOUR-NEW-PSA-CODE
         BGS_ADMIN_CODE: YOUR-NEW-BGS-CODE
         SGC_ADMIN_CODE: YOUR-NEW-SGC-CODE
         CGC_ADMIN_CODE: YOUR-NEW-CGC-CODE
         SUPER_ADMIN_CODE: YOUR-NEW-SUPER-CODE
   ```

2. Rebuild and redeploy:
   ```bash
   sam build && sam deploy --resolve-s3
   ```

3. Distribute new codes to authorized personnel only

## User Signup Flow

### Step 1: Navigate to Admin Portal

- Development: `http://localhost:5173/admin`
- Production: `https://yourdomain.com/admin`

### Step 2: Click "Sign Up"

From the admin login page, click the "Sign Up" button to create a new account.

### Step 3: Fill Out Basic Information

- **Name**: Full name
- **Email**: Valid email address
- **Password**: Must meet requirements (min 8 chars, uppercase, lowercase, number)

### Step 4: Select Company & Enter Code

The signup form includes an optional "Admin Signup" section:

1. **Select your grading company** from the dropdown:
   - Regular User (No admin access)
   - PSA (Professional Sports Authenticator)
   - BGS (Beckett Grading Services)
   - SGC (Sportscard Guaranty)
   - CGC (Certified Guaranty Company)
   - Super Admin (All Companies)

2. **Enter the admin code** for your selected company
   - Contact your company administrator to obtain the code
   - Code is case-sensitive
   - Code must match exactly

### Step 5: Confirm Email

After signing up:
1. Check your email for a confirmation code
2. Enter the code on the confirmation page
3. Click "Confirm"

### Step 6: Automatic Admin Assignment

After email confirmation:
- The **post-confirmation Lambda trigger** automatically runs
- It validates your admin code against the stored codes
- If valid, you're added to the appropriate admin group
- If invalid, you become a regular user (no admin access)

### Step 7: Sign In

Once confirmed, sign in with your email and password. You'll now have admin access to your company's submissions.

## Security Features

### Code Validation

- Codes are stored in Lambda environment variables (server-side)
- Never exposed to the client
- Validated only after email confirmation
- Invalid codes don't prevent signup, but user won't get admin access

### Failed Validation Handling

If an invalid code is entered:
- User account is still created successfully
- Email confirmation still required
- User becomes a regular user (not an admin)
- No admin group assignment
- No error shown to user (for security)

To check if assignment worked:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username user@example.com \
  --region us-east-1
```

### Company Isolation

Once assigned to a company admin group:
- PSA admins can only see PSA submissions
- BGS admins can only see BGS submissions
- SGC admins can only see SGC submissions
- CGC admins can only see CGC submissions
- Super Admins can see all submissions

## Troubleshooting

### User Created But No Admin Access

**Symptoms:**
- User can sign in
- User reaches admin dashboard
- See "Access Denied" or no submissions visible

**Causes:**
1. Incorrect admin code entered during signup
2. Post-confirmation Lambda trigger failed
3. User selected "Regular User" instead of a company

**Solution:**

Check if user is in an admin group:
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username user@example.com \
  --region us-east-1
```

If not in a group, manually add them:
```bash
./scripts/assign-company-admin.sh
```

Or via AWS CLI:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --username user@example.com \
  --group-name PSA-Admins \
  --region us-east-1
```

### Lambda Trigger Not Running

Check CloudWatch Logs for the post-confirmation function:

```bash
aws logs tail /aws/lambda/CardGradingPostConfirmation --follow
```

Look for:
- Trigger execution logs
- Code validation results
- Group assignment results
- Any errors

### Admin Code Not Working

Verify the code in Lambda environment variables:

```bash
aws lambda get-function-configuration \
  --function-name CardGradingPostConfirmation \
  --query 'Environment.Variables'
```

## Best Practices

### For Company Administrators

1. **Protect admin codes** - Share only with authorized personnel
2. **Rotate codes periodically** - Update every 3-6 months
3. **Use strong codes** - Long, random, alphanumeric
4. **Monitor admin assignments** - Regularly review who has admin access
5. **Audit logs** - Review CloudWatch logs for signup attempts

### For End Users

1. **Keep code confidential** - Don't share or write it down publicly
2. **Verify company selection** - Make sure you select the correct company
3. **Use strong password** - Follow password requirements carefully
4. **Verify email** - Must confirm email to complete signup
5. **Contact admin if issues** - Don't try multiple codes

## Advantages of Self-Service Signup

✅ **No AWS CLI access needed** - Non-technical admins can sign up easily
✅ **Immediate access** - Admins get access as soon as they confirm email
✅ **Secure** - Codes validate authorization before granting access
✅ **Self-service** - Reduces burden on IT/DevOps teams
✅ **Company isolation** - Each company manages their own admin codes
✅ **Audit trail** - All signups logged in CloudWatch

## Migration from Manual Assignment

If you previously used manual admin assignment via AWS CLI:

1. **Existing admins keep their access** - No changes needed
2. **New admins can self-sign up** - Using the new signup flow
3. **Both methods work** - Manual and self-service coexist
4. **Gradually transition** - Move to self-service over time

## Monitoring and Analytics

### View Recent Admin Signups

Check CloudWatch Logs:
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/CardGradingPostConfirmation \
  --start-time $(date -u -d '1 day ago' +%s)000 \
  --filter-pattern "Successfully added user"
```

### Count Admins by Company

```bash
# PSA Admins
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --group-name PSA-Admins \
  --query 'Users[*].Username' \
  --output table

# Repeat for BGS-Admins, SGC-Admins, CGC-Admins, Super-Admins
```

## Support

If you encounter issues:

1. Check this documentation
2. Review CloudWatch logs
3. Verify admin code is correct
4. Contact your company administrator
5. For technical issues, check Lambda function logs

## Security Notice

🔒 **Admin codes are sensitive credentials**
📋 **Store securely** (password manager, encrypted file)
🚫 **Never commit to version control**
♻️ **Rotate regularly**
👥 **Share only with authorized personnel**
