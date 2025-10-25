# Admin Portal Access Guide

## Accessing the Admin Portal

The admin portal is now completely separate from the main submission page.

### Admin Portal URL

- **Development**: `http://localhost:5173/admin`
- **Production**: `https://yourdomain.com/admin` (after deployment)

### Main Submission Page

- **Development**: `http://localhost:5173/`
- **Production**: `https://yourdomain.com/` (after deployment)

## Admin Portal Features

### Company-Specific Access

The admin portal supports company-specific admin access with the following groups:

1. **PSA-Admins** - Can only view PSA submissions
2. **BGS-Admins** - Can only view BGS submissions
3. **SGC-Admins** - Can only view SGC submissions
4. **CGC-Admins** - Can only view CGC submissions
5. **Super-Admins** - Can view all submissions from all companies

### Admin Dashboard Capabilities

- **Search Submissions**: Search by submission ID
- **Recent Submissions**: View recent submissions (filtered by company)
- **Submission Details**: View full details including:
  - Submitter information
  - Contact details
  - Card details (player, year, manufacturer, condition, value)
  - Uploaded images
  - Submission status
- **Company Badge**: Shows which company you have access to

### Social Login for Admins

Admins can sign in using:
- Email/Password (Cognito authentication)
- Google account (OAuth)
- Facebook account (OAuth)

## Creating Admin Users

### Self-Service Admin Signup (Recommended)

**NEW:** Admins can now sign up for their company-specific admin access directly through the signup form!

1. Navigate to the admin portal: `http://localhost:5173/admin`
2. Click "Sign Up"
3. Fill out name, email, and password
4. In the "Admin Signup (Optional)" section:
   - Select your grading company from the dropdown
   - Enter the admin code for your company
5. Click "Sign Up" and confirm your email
6. You'll automatically be added to the correct admin group!

**Admin Codes:**
- PSA: `PSA-SECURE-2024`
- BGS: `BGS-SECURE-2024`
- SGC: `SGC-SECURE-2024`
- CGC: `CGC-SECURE-2024`
- Super Admin: `SUPER-SECURE-2024`

📖 **See [ADMIN_SELF_SIGNUP.md](./ADMIN_SELF_SIGNUP.md) for complete self-signup documentation**

### Using the Helper Script (Alternative Method)

For manual admin assignment, the easiest way to assign admin privileges:

```bash
./scripts/assign-company-admin.sh
```

This interactive script will:
1. Show available companies
2. Ask for user email
3. Confirm the assignment
4. Add the user to the selected admin group

### Manual Assignment via AWS CLI

```bash
# 1. Create the user (if they don't exist)
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_zHIFesZkh \
  --username admin@example.com \
  --region us-east-1

# 2. Set their password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_zHIFesZkh \
  --username admin@example.com \
  --password YourSecurePassword123 \
  --permanent \
  --region us-east-1

# 3. Add to company admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-east-1_zHIFesZkh \
  --username admin@example.com \
  --group-name PSA-Admins \
  --region us-east-1
```

### Available Admin Groups

Replace `PSA-Admins` in the command above with:
- `PSA-Admins` - Professional Sports Authenticator
- `BGS-Admins` - Beckett Grading Services
- `SGC-Admins` - Sportscard Guaranty
- `CGC-Admins` - Certified Guaranty Company
- `Super-Admins` - Access to all companies

## Security Considerations

### Access Control

- Lambda functions verify admin group membership on every request
- Company admins receive 403 Forbidden if they try to access another company's submissions
- Super Admins can access all submissions
- All admin endpoints require valid JWT token from Cognito

### JWT Token Validation

- Access tokens expire after 60 minutes
- ID tokens expire after 60 minutes
- Refresh tokens expire after 30 days
- API Gateway automatically validates tokens before allowing access

### Password Requirements

For email/password authentication:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters are optional

## Troubleshooting

### "Access Denied" Message

If you see "Access Denied" when trying to access the admin dashboard:

1. **Check if user is in an admin group**:
   ```bash
   aws cognito-idp admin-list-groups-for-user \
     --user-pool-id us-east-1_zHIFesZkh \
     --username your@email.com \
     --region us-east-1
   ```

2. **Add user to admin group** using the script or AWS CLI (see above)

### "Submission Not Found" or "Forbidden"

If you can access the dashboard but can't see a specific submission:

1. **Verify the submission's grading company**
   - PSA admins can only see PSA submissions
   - BGS admins can only see BGS submissions
   - etc.

2. **Check if you need Super Admin access**
   - Only Super-Admins can see all submissions

### Social Login Not Working

If social login buttons don't appear or fail:

1. **Check environment variables** in `.env`:
   ```
   VITE_COGNITO_DOMAIN=card-grading-923849122289
   ```

2. **Verify Google/Facebook providers are configured** in Cognito
   - See `SOCIAL_LOGIN_SETUP.md` for configuration steps

3. **Check callback URLs** in Cognito User Pool Client settings:
   - `http://localhost:5173`
   - `http://localhost:5173/`

## Navigation

### From Main Page to Admin Portal

Users cannot navigate from the main submission page to the admin portal via UI buttons. Admins must access the admin portal directly:

**Development**: Navigate to `http://localhost:5173/admin`

### From Admin Portal to Main Page

Click the **"← Back to Home"** button at the top of the admin portal.

## Best Practices

1. **Use Super-Admins sparingly** - Only give Super Admin access to users who need to see all submissions
2. **Assign company-specific admins** - Most admins should be assigned to a specific company
3. **Use the helper script** - The `assign-company-admin.sh` script prevents typos and mistakes
4. **Regular audits** - Periodically review who has admin access
5. **Strong passwords** - Enforce strong passwords for email/password authentication
6. **Enable MFA** - Consider enabling multi-factor authentication in Cognito for admin users
