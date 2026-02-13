export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const STORAGE_KEYS = {
  accessToken: 'fp_access_token',
  refreshToken: 'fp_refresh_token',
  authUser: 'fp_auth_user',
};
