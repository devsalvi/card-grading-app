import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';

// Configure Amplify with Cognito settings
const configureAuth = () => {
  if (!import.meta.env.VITE_COGNITO_USER_POOL_ID || !import.meta.env.VITE_COGNITO_CLIENT_ID) {
    console.warn('Cognito not configured. Authentication features will be disabled.');
    return false;
  }

  const config = {
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      }
    }
  };

  Amplify.configure(config);

  return true;
};

// Initialize configuration
const isConfigured = configureAuth();

/**
 * Sign up a new user
 */
export async function signUpUser({ email, password, name, company, adminCode }) {
  if (!isConfigured) {
    throw new Error('Authentication is not configured');
  }

  try {
    const userAttributes = {
      email,
      name
    };

    // Add custom attributes for admin signup if provided
    if (company) {
      userAttributes['custom:company'] = company;
    }
    if (adminCode) {
      userAttributes['custom:adminCode'] = adminCode;
    }

    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: email,
      password,
      options: {
        userAttributes
      }
    });

    return {
      isSignUpComplete,
      userId,
      nextStep
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUpUser(email, code) {
  if (!isConfigured) {
    throw new Error('Authentication is not configured');
  }

  try {
    const { isSignUpComplete, nextStep } = await confirmSignUp({
      username: email,
      confirmationCode: code
    });

    return { isSignUpComplete, nextStep };
  } catch (error) {
    console.error('Confirm sign up error:', error);
    throw error;
  }
}

/**
 * Resend confirmation code
 */
export async function resendConfirmationCode(email) {
  if (!isConfigured) {
    throw new Error('Authentication is not configured');
  }

  try {
    await resendSignUpCode({ username: email });
    return true;
  } catch (error) {
    console.error('Resend code error:', error);
    throw error;
  }
}

/**
 * Sign in an existing user
 */
export async function signInUser(email, password) {
  if (!isConfigured) {
    throw new Error('Authentication is not configured');
  }

  try {
    const { isSignedIn, nextStep } = await signIn({
      username: email,
      password
    });

    return { isSignedIn, nextStep };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  if (!isConfigured) {
    throw new Error('Authentication is not configured');
  }

  try {
    await signOut();
    return true;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser() {
  if (!isConfigured) {
    return null;
  }

  try {
    const user = await getCurrentUser();
    return user;
  } catch (error) {
    // User is not signed in
    return null;
  }
}

/**
 * Get authentication token for API requests
 */
export async function getAuthToken() {
  if (!isConfigured) {
    return null;
  }

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return token;
  } catch (error) {
    console.error('Get auth token error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  if (!isConfigured) {
    return false;
  }

  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Check if user is in admin group
 * This checks the Cognito groups claim in the ID token
 */
export async function isAdmin() {
  if (!isConfigured) {
    return false;
  }

  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (!idToken) return false;

    const payload = idToken.payload;
    const groups = payload['cognito:groups'] || [];

    // Check if user is in any admin group
    const adminGroups = ['Super-Admins', 'PSA-Admins', 'BGS-Admins', 'SGC-Admins', 'CGC-Admins'];
    return adminGroups.some(group => groups.includes(group));
  } catch (error) {
    console.error('Is admin check error:', error);
    return false;
  }
}

/**
 * Get admin company information
 * Returns { isSuperAdmin: boolean, company: string|null, companyName: string|null }
 */
export async function getAdminCompany() {
  if (!isConfigured) {
    return { isSuperAdmin: false, company: null, companyName: null };
  }

  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (!idToken) return { isSuperAdmin: false, company: null, companyName: null };

    const payload = idToken.payload;
    const groups = payload['cognito:groups'] || [];

    // Check if super admin
    if (groups.includes('Super-Admins')) {
      return { isSuperAdmin: true, company: null, companyName: 'All Companies' };
    }

    // Check for company-specific admin groups
    const companyMap = {
      'PSA-Admins': { id: 'psa', name: 'PSA (Professional Sports Authenticator)' },
      'BGS-Admins': { id: 'bgs', name: 'BGS (Beckett Grading Services)' },
      'SGC-Admins': { id: 'sgc', name: 'SGC (Sportscard Guaranty)' },
      'CGC-Admins': { id: 'cgc', name: 'CGC (Certified Guaranty Company)' }
    };

    for (const [groupName, companyInfo] of Object.entries(companyMap)) {
      if (groups.includes(groupName)) {
        return {
          isSuperAdmin: false,
          company: companyInfo.id,
          companyName: companyInfo.name
        };
      }
    }

    return { isSuperAdmin: false, company: null, companyName: null };
  } catch (error) {
    console.error('Get admin company error:', error);
    return { isSuperAdmin: false, company: null, companyName: null };
  }
}

/**
 * Check if authentication is configured
 */
export function isAuthConfigured() {
  return isConfigured;
}


/**
 * Get user attributes (name, email, address, etc.)
 */
export async function getUserAttributes() {
  if (!isConfigured) {
    return null;
  }

  try {
    const attributes = await fetchUserAttributes();
    return attributes;
  } catch (error) {
    console.error('Get user attributes error:', error);
    return null;
  }
}

/**
 * Get user profile information for form auto-fill
 */
export async function getUserProfile() {
  if (!isConfigured) {
    return null;
  }

  try {
    const attributes = await fetchUserAttributes();

    return {
      name: attributes.name || '',
      email: attributes.email || '',
      address: attributes.address || '',
      phone: attributes.phone_number || '',
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}
