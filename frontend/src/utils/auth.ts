// Auth utility functions for managing Cognito tokens

interface TokenData {
  accessToken: string;
  idToken: string;
  expiresAt: number;
}

const TOKEN_KEY = 'blog_auth_tokens';

export const saveTokens = (accessToken: string, idToken: string, expiresIn: number) => {
  const expiresAt = Date.now() + expiresIn * 1000;
  const tokenData: TokenData = {
    accessToken,
    idToken,
    expiresAt,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
};

export const getTokens = (): TokenData | null => {
  const data = localStorage.getItem(TOKEN_KEY);
  if (!data) return null;

  try {
    const tokenData: TokenData = JSON.parse(data);
    // Check if token is expired
    if (Date.now() >= tokenData.expiresAt) {
      clearTokens();
      return null;
    }
    return tokenData;
  } catch {
    return null;
  }
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = (): boolean => {
  return getTokens() !== null;
};

export const getAuthHeader = (): string | null => {
  const tokens = getTokens();
  if (!tokens) return null;
  return `Bearer ${tokens.idToken}`;
};

// Parse tokens from URL hash (Cognito redirect)
export const parseTokensFromUrl = (): { accessToken: string; idToken: string; expiresIn: number } | null => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const accessToken = params.get('access_token');
  const idToken = params.get('id_token');
  const expiresIn = params.get('expires_in');

  if (accessToken && idToken && expiresIn) {
    return {
      accessToken,
      idToken,
      expiresIn: parseInt(expiresIn, 10),
    };
  }

  return null;
};
