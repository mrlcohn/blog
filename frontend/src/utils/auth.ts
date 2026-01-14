// Auth utility functions using AWS Amplify
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
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
