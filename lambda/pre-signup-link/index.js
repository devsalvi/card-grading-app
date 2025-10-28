const { CognitoIdentityProviderClient, AdminLinkProviderForUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

/**
 * Cognito Pre-Signup Lambda Trigger
 * Automatically links Google federated accounts to existing email/password accounts
 */
exports.handler = async (event) => {
  console.log('Pre-Signup trigger event:', JSON.stringify(event, null, 2));

  try {
    // Get User Pool ID from the event
    const userPoolId = event.userPoolId;

    // Only process external provider signups (Google, Facebook, etc.)
    if (event.triggerSource === 'PreSignUp_ExternalProvider') {
      const email = event.request.userAttributes.email;
      const providerName = event.userName.split('_')[0]; // e.g., "Google_123456" -> "Google"

      console.log(`External provider signup detected: ${providerName} for email: ${email}`);

      // Check if a user with this email already exists
      const listUsersCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`
      });

      const existingUsers = await cognitoClient.send(listUsersCommand);
      console.log(`Found ${existingUsers.Users?.length || 0} existing users with email ${email}`);

      if (existingUsers.Users && existingUsers.Users.length > 0) {
        const existingUser = existingUsers.Users[0];

        // Check if existing user is a native Cognito user (not already federated)
        if (!existingUser.Username.includes('_')) {
          console.log(`Linking federated account ${event.userName} to existing user ${existingUser.Username}`);

          // Link the federated identity to the existing user
          const linkCommand = new AdminLinkProviderForUserCommand({
            UserPoolId: userPoolId,
            DestinationUser: {
              ProviderName: 'Cognito',
              ProviderAttributeValue: existingUser.Username
            },
            SourceUser: {
              ProviderName: providerName,
              ProviderAttributeName: 'Cognito_Subject',
              ProviderAttributeValue: event.request.userAttributes.sub
            }
          });

          await cognitoClient.send(linkCommand);
          console.log('Successfully linked accounts');

          // Auto-confirm the user and link to existing account
          event.response.autoConfirmUser = true;
          event.response.autoVerifyEmail = true;
        } else {
          console.log('Existing user is already federated, allowing normal flow');
        }
      } else {
        console.log('No existing user found, allowing new user creation');
        // No existing user, allow normal signup
        event.response.autoConfirmUser = true;
        event.response.autoVerifyEmail = true;
      }
    }

    return event;
  } catch (error) {
    console.error('Error in Pre-Signup trigger:', error);
    // Don't block signup on errors, just log them
    return event;
  }
};
