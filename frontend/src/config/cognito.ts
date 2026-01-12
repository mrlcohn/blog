// Cognito configuration
// These values will be populated from Terraform outputs after deployment

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
};

export const getAuthUrl = (type: 'login' | 'logout') => {
  const redirectUri = window.location.origin + '/admin/callback';
  const logoutUri = window.location.origin;

  if (type === 'login') {
    return `https://${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com/login?client_id=${cognitoConfig.clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
  } else {
    return `https://${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com/logout?client_id=${cognitoConfig.clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  }
};
