import { Response, CookieOptions } from 'express';
import { config } from '../config/env';

// 15 minutes for access token, 7 days for refresh token
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
    path: '/',
  });

  if (refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/api/v1/auth',
    });
  }
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/',
  });
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...baseCookieOptions,
    path: '/api/v1/auth',
  });
}
