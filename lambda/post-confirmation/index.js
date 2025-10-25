/**
 * Cognito Post-Confirmation Trigger
 *
 * This Lambda is triggered after a user confirms their email.
 * It checks if the user provided a company and admin code,
 * validates the code, and adds them to the appropriate admin group.
 */

const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

// Company admin codes (in production, store these in AWS Systems Manager Parameter Store or Secrets Manager)
// These codes should be shared only with authorized admin users for each company
const ADMIN_CODES = {
  'psa': process.env.PSA_ADMIN_CODE || 'PSA-ADMIN-2024',
  'bgs': process.env.BGS_ADMIN_CODE || 'BGS-ADMIN-2024',
  'sgc': process.env.SGC_ADMIN_CODE || 'SGC-ADMIN-2024',
  'cgc': process.env.CGC_ADMIN_CODE || 'CGC-ADMIN-2024',
  'super': process.env.SUPER_ADMIN_CODE || 'SUPER-ADMIN-2024'
};

// Map company IDs to Cognito group names
const COMPANY_TO_GROUP = {
  'psa': 'PSA-Admins',
  'bgs': 'BGS-Admins',
  'sgc': 'SGC-Admins',
  'cgc': 'CGC-Admins',
  'super': 'Super-Admins'
};

/**
 * Add user to Cognito group
 */
async function addUserToGroup(userPoolId, username, groupName) {
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: groupName
  });

  try {
    await cognitoClient.send(command);
    console.log(`Successfully added user ${username} to group ${groupName}`);
    return true;
  } catch (error) {
    console.error(`Error adding user to group:`, error);
    throw error;
  }
}

/**
 * Main handler for post-confirmation trigger
 */
exports.handler = async (event) => {
  console.log('Post-confirmation trigger event:', JSON.stringify(event, null, 2));

  const { userPoolId, userName } = event;
  const userAttributes = event.request.userAttributes;

  // Get custom attributes
  const company = userAttributes['custom:company'];
  const adminCode = userAttributes['custom:adminCode'];

  console.log('User attributes:', { company, adminCode: adminCode ? '[PROVIDED]' : '[NOT PROVIDED]' });

  // If no company or admin code provided, this is a regular user (not an admin)
  if (!company || !adminCode) {
    console.log('No admin signup detected. User will be a regular user.');
    return event;
  }

  // Validate company
  if (!COMPANY_TO_GROUP[company]) {
    console.error(`Invalid company: ${company}`);
    // Don't fail the signup, just don't add to admin group
    return event;
  }

  // Validate admin code
  const expectedCode = ADMIN_CODES[company];
  if (adminCode !== expectedCode) {
    console.error(`Invalid admin code for company: ${company}`);
    // Don't fail the signup, just don't add to admin group
    // In production, you might want to flag this for review
    return event;
  }

  // Code is valid - add user to the appropriate admin group
  const groupName = COMPANY_TO_GROUP[company];

  try {
    await addUserToGroup(userPoolId, userName, groupName);
    console.log(`User ${userName} successfully added to ${groupName}`);
  } catch (error) {
    console.error('Failed to add user to admin group:', error);
    // Don't fail the entire signup process
  }

  return event;
};
