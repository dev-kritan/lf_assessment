"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const env_1 = require("../config/env");
// 15 minutes for access token, 7 days for refresh token
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
exports.ACCESS_TOKEN_COOKIE = 'accessToken';
exports.REFRESH_TOKEN_COOKIE = 'refreshToken';
const baseCookieOptions = {
    httpOnly: true,
    secure: env_1.config.isProd,
    sameSite: 'lax',
};
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie(exports.ACCESS_TOKEN_COOKIE, accessToken, {
        ...baseCookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: '/',
    });
    if (refreshToken) {
        res.cookie(exports.REFRESH_TOKEN_COOKIE, refreshToken, {
            ...baseCookieOptions,
            maxAge: REFRESH_TOKEN_MAX_AGE,
            path: '/api/v1/auth',
        });
    }
}
function clearAuthCookies(res) {
    res.clearCookie(exports.ACCESS_TOKEN_COOKIE, {
        ...baseCookieOptions,
        path: '/',
    });
    res.clearCookie(exports.REFRESH_TOKEN_COOKIE, {
        ...baseCookieOptions,
        path: '/api/v1/auth',
    });
}
