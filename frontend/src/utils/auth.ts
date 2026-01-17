// Auth utility functions using AWS Amplify
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // fetchAuthSession waits for Amplify to fully hydrate tokens from storage
    // This is more reliable than getCurrentUser for checking auth state
    const session = await fetchAuthSession();
    return !!session.tokens;
  } catch {
    return false;
  }
};

export const getAuthHeader = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    return idToken ? `Bearer ${idToken}` : null;
  } catch {
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  await signOut();
};
