import { Response, CookieOptions } from 'express';
import { config } from '../config/env';

import { AUTH_COOKIES, TOKEN_DURATIONS } from '../constants';

const ACCESS_TOKEN_MAX_AGE = TOKEN_DURATIONS.ACCESS_TOKEN_MS;
const REFRESH_TOKEN_MAX_AGE = TOKEN_DURATIONS.REFRESH_TOKEN_MS;

export const ACCESS_TOKEN_COOKIE = AUTH_COOKIES.ACCESS_TOKEN;
export const REFRESH_TOKEN_COOKIE = AUTH_COOKIES.REFRESH_TOKEN;

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
