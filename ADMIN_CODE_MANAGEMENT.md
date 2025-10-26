# Admin Code Management Guide

This guide shows you how to manage admin signup codes for your production environment.

---

## 📋 Current Admin Codes (Production)

Your current admin codes are:

| Company | Code | Group Assignment |
|---------|------|-----------------|
| **PSA** | `PSA-SECURE-2024` | PSA-Admins |
| **BGS** | `BGS-SECURE-2024` | BGS-Admins |
| **SGC** | `SGC-SECURE-2024` | SGC-Admins |
| **CGC** | `CGC-SECURE-2024` | CGC-Admins |
| **Super Admin** | `SUPER-SECURE-2024` | Super-Admins |

**⚠️ IMPORTANT**: These codes should be kept confidential and only shared with authorized personnel.

---

## 👥 How to Share Admin Codes with Users

### Step 1: Identify the User's Company

Determine which grading company the user represents:
- PSA (Professional Sports Authenticator)
- BGS (Beckett Grading Services)
- SGC (Sportscard Guaranty)
- CGC (Certified Guaranty Company)
- Super Admin (All Companies)

### Step 2: Share the Appropriate Code

**Securely send them**:
1. Their company's admin code
2. Instructions for signing up

**Example message template**:

```
Subject: Admin Access for Card Grading App

Hi [Name],

You've been granted admin access for [Company Name] on our card grading platform.

🌐 Website: https://collectbl.com/admin

📝 Signup Instructions:
1. Visit https://collectbl.com/admin
2. Click "Sign Up"
3. Enter your email and create a password
4. In the "Grading Company" dropdown, select: [Company Name]
5. Enter admin code: [CODE]
6. Click "Sign Up"
7. Check your email for verification
8. Click the verification link
9. You'll be automatically added to the [Company]-Admins group

Once verified, you can:
- View submissions for [Company Name]
- Access the admin dashboard at https://collectbl.com/admin

Questions? Reply to this email.

Best regards,
[Your Name]
```

### Step 3: User Signup Flow

**What the user does**:

1. **Visit**: https://collectbl.com/admin

2. **Click "Sign Up"**

3. **Fill in the form**:
   - Email address
   - Password (min 8 chars, uppercase, lowercase, number)
   - Name
   - **Company dropdown**: Select their company (PSA, BGS, SGC, or CGC)
   - **Admin code**: Enter the code you provided

4. **Click "Sign Up"**

5. **Check email** for verification link

6. **Click verification link**

7. **Done!** They're automatically added to their company's admin group

---

## 🔐 View Current Admin Codes

### Via AWS CLI

```bash
# View all admin codes
aws lambda get-function-configuration \
  --function-name CardGradingPostConfirmation \
  --query 'Environment.Variables' \
  --output json
```

### Via AWS Console

1. Go to: https://console.aws.amazon.com/lambda/
2. Search for: `CardGradingPostConfirmation`
3. Click on the function
4. Go to "Configuration" tab → "Environment variables"
5. View the codes

---

## 🔄 Update Admin Codes

### When to Update Codes

- **Security**: If a code has been compromised
- **Rotation**: Regular security practice (every 90 days recommended)
- **Custom**: You want more memorable or secure codes

### How to Update Codes

#### Method 1: Update via template.yaml (Recommended)

1. **Edit template.yaml**:

```yaml
PostConfirmationFunction:
  Type: AWS::Serverless::Function
  Properties:
    Environment:
      Variables:
        PSA_ADMIN_CODE: YOUR-NEW-PSA-CODE-2024
        BGS_ADMIN_CODE: YOUR-NEW-BGS-CODE-2024
        SGC_ADMIN_CODE: YOUR-NEW-SGC-CODE-2024
        CGC_ADMIN_CODE: YOUR-NEW-CGC-CODE-2024
        SUPER_ADMIN_CODE: YOUR-NEW-SUPER-CODE-2024
```

2. **Deploy the update**:

```bash
sam build && sam deploy --resolve-s3
```

3. **Notify users** of the new codes

#### Method 2: Update via AWS CLI (Quick Fix)

```bash
# Update PSA admin code
aws lambda update-function-configuration \
  --function-name CardGradingPostConfirmation \
  --environment "Variables={
    PSA_ADMIN_CODE=YOUR-NEW-PSA-CODE,
    BGS_ADMIN_CODE=BGS-SECURE-2024,
    SGC_ADMIN_CODE=SGC-SECURE-2024,
    CGC_ADMIN_CODE=CGC-SECURE-2024,
    SUPER_ADMIN_CODE=SUPER-SECURE-2024,
    DYNAMODB_TABLE_NAME=CardGradingSubmissions
  }"
```

**⚠️ Note**: When updating via CLI, you must provide ALL environment variables, not just the one you're changing.

---

## 🎯 Best Practices for Admin Codes

### 1. Code Security

✅ **DO**:
- Use strong, unique codes for each company
- Keep codes confidential
- Share codes only via secure channels (encrypted email, password managers)
- Rotate codes periodically (every 90 days)
- Track who has which codes

❌ **DON'T**:
- Share codes publicly (GitHub, Slack, etc.)
- Reuse codes across companies
- Use simple/guessable codes
- Share the same code with multiple people without tracking

### 2. Code Format Recommendations

**Good code format**:
```
[COMPANY]-[RANDOM-WORD]-[YEAR]

Examples:
- PSA-MOUNTAIN-2024
- BGS-RIVER-2024
- SGC-FOREST-2024
```

**Generate secure random codes**:
```bash
# Generate a random code
echo "PSA-$(openssl rand -base64 12 | tr -dc 'A-Z0-9' | head -c 8)-2024"
```

### 3. Code Rotation Schedule

| Action | Frequency | When |
|--------|-----------|------|
| Review access | Monthly | 1st of month |
| Rotate codes | Quarterly | Jan 1, Apr 1, Jul 1, Oct 1 |
| Audit users | Quarterly | With rotation |
| Emergency rotation | Immediately | If compromised |

---

## 📊 Track Admin Users

### List All Admin Users

```bash
# List all users in a specific admin group
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --group-name PSA-Admins \
  --query 'Users[*].[Username,UserCreateDate,UserStatus]' \
  --output table
```

### List All Admin Groups

```bash
# List all admin groups
aws cognito-idp list-groups \
  --user-pool-id us-east-1_zHIFesZkh \
  --query 'Groups[*].[GroupName,Description]' \
  --output table
```

---

## 🚨 Emergency: Code Compromised

If an admin code is compromised:

### 1. Immediately Rotate the Code

```bash
# Update the compromised code
aws lambda update-function-configuration \
  --function-name CardGradingPostConfirmation \
  --environment "Variables={
    PSA_ADMIN_CODE=NEW-EMERGENCY-CODE-2024,
    BGS_ADMIN_CODE=BGS-SECURE-2024,
    SGC_ADMIN_CODE=SGC-SECURE-2024,
    CGC_ADMIN_CODE=CGC-SECURE-2024,
    SUPER_ADMIN_CODE=SUPER-SECURE-2024,
    DYNAMODB_TABLE_NAME=CardGradingSubmissions
  }"
```

### 2. Audit Recent Signups

Check for unauthorized signups in the last 24-48 hours:

```bash
# List recent users in the affected group
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --group-name PSA-Admins
```

### 3. Remove Unauthorized Users

```bash
# Remove a user from admin group
aws cognito-idp admin-remove-user-from-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --username unauthorized@example.com \
  --group-name PSA-Admins

# Or delete the user entirely
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username unauthorized@example.com
```

### 4. Notify Legitimate Users

Send updated codes to all legitimate users of that company.

---

## 📧 Email Templates for Sharing Codes

### Template 1: Initial Admin Invitation

```
Subject: Admin Access Invitation - Card Grading Platform

Hi [Name],

Welcome to the Card Grading Platform admin team!

You've been granted admin access for [Company Name].

🔐 Your Admin Credentials:
- Website: https://collectbl.com/admin
- Company: [Company Name]
- Admin Code: [CODE]

📝 Setup Instructions:
1. Visit https://collectbl.com/admin
2. Click "Sign Up"
3. Use your work email: [their email]
4. Create a secure password
5. Select company: [Company Name]
6. Enter admin code: [CODE]
7. Verify your email
8. Access the dashboard

⚠️ Security Reminder:
- Keep your admin code confidential
- Do not share your account
- Use a strong password

Questions? Contact [Your Contact Info]

Welcome aboard!
[Your Name]
```

### Template 2: Code Rotation Update

```
Subject: Updated Admin Code - Card Grading Platform

Hi [Name],

As part of our regular security maintenance, we've updated admin codes.

🔐 Your New Admin Code: [NEW-CODE]

✅ Action Required:
- New users: Use the new code for signup
- Existing users: No action needed (already in system)

The old code will stop working on [DATE].

Questions? Reply to this email.

Best regards,
[Your Name]
```

---

## 🎓 Admin User Guide

Share this with new admins:

### What Admins Can Do

**PSA/BGS/SGC/CGC Admins**:
- ✅ View submissions for their company
- ✅ Search submissions by email
- ✅ View submission details
- ✅ Access admin dashboard
- ❌ Cannot view other companies' submissions

**Super Admins**:
- ✅ View ALL submissions
- ✅ View ALL companies
- ✅ Full dashboard access
- ✅ Search across all companies

### Access the Admin Dashboard

1. **Login**: https://collectbl.com/admin
2. **Enter your email/password**
3. **View dashboard** with your company's submissions

---

## 🔍 Verify Admin Setup

### Test Admin Signup Flow

Create a test admin account:

```bash
# 1. Visit https://collectbl.com/admin
# 2. Sign up with test email
# 3. Use admin code
# 4. Verify email
# 5. Check if added to group:

aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username test@example.com
```

---

## 📊 Quick Reference

### Current Configuration

- **User Pool ID**: `us-east-1_zHIFesZkh`
- **Lambda Function**: `CardGradingPostConfirmation`
- **Admin Portal**: https://collectbl.com/admin

### Admin Groups

| Group | Access Level |
|-------|-------------|
| Super-Admins | All companies |
| PSA-Admins | PSA only |
| BGS-Admins | BGS only |
| SGC-Admins | SGC only |
| CGC-Admins | CGC only |

### Quick Commands

```bash
# View current codes
aws lambda get-function-configuration \
  --function-name CardGradingPostConfirmation \
  --query 'Environment.Variables'

# List admins in a group
aws cognito-idp list-users-in-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --group-name PSA-Admins

# Check user's groups
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username admin@example.com
```

---

## 🎯 Summary

**Current Codes** (Production):
- PSA: `PSA-SECURE-2024`
- BGS: `BGS-SECURE-2024`
- SGC: `SGC-SECURE-2024`
- CGC: `CGC-SECURE-2024`
- Super Admin: `SUPER-SECURE-2024`

**To Share with Users**:
1. Determine their company
2. Share the appropriate code securely
3. Direct them to https://collectbl.com/admin
4. They sign up with company + code
5. Email verification
6. Automatically added to admin group

**Security**:
- Rotate codes quarterly
- Track who has codes
- Monitor new signups
- Remove unauthorized users

Your admin self-service signup is ready to use! 🚀
