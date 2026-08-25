"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE = exports.ACCESS_TOKEN_COOKIE = void 0;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const env_1 = require("../config/env");
const constants_1 = require("../constants");
const ACCESS_TOKEN_MAX_AGE = constants_1.TOKEN_DURATIONS.ACCESS_TOKEN_MS;
const REFRESH_TOKEN_MAX_AGE = constants_1.TOKEN_DURATIONS.REFRESH_TOKEN_MS;
exports.ACCESS_TOKEN_COOKIE = constants_1.AUTH_COOKIES.ACCESS_TOKEN;
exports.REFRESH_TOKEN_COOKIE = constants_1.AUTH_COOKIES.REFRESH_TOKEN;
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
