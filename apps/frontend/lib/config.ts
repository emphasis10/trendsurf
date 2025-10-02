export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
export const ACCESS_TOKEN_COOKIE = 'ts.access_token';
export const REFRESH_TOKEN_COOKIE = 'ts.refresh_token';
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
