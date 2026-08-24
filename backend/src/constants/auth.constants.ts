export const AUTH_COOKIES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export const TOKEN_DURATIONS = {
  ACCESS_TOKEN_MS: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH_TOKEN_DAYS: 7,
} as const;

export const AUTH_CONFIG = {
  SALT_ROUNDS: 10,
  VERIFICATION_TOKEN_BYTES: 32,
  DEFAULT_AVATAR_BASE_URL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=',
  TOTP_WINDOW: 1,
  TOTP_SECRET_LENGTH: 20,
  TOTP_DIGITS: 6,
} as const;
