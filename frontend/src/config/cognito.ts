// Cognito configuration with AWS Amplify
import { Amplify } from 'aws-amplify';

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
};

// Debug: Log config to verify env vars are loaded
console.log('Cognito Config:', {
  userPoolId: cognitoConfig.userPoolId,
  clientId: cognitoConfig.clientId,
  region: cognitoConfig.region,
  hasUserPoolId: !!cognitoConfig.userPoolId,
  hasClientId: !!cognitoConfig.clientId,
});

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.clientId,
      loginWith: {
        email: true,
      },
    },
  },
});
