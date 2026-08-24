"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const knex_1 = __importDefault(require("../config/knex"));
const token_utils_1 = require("../utils/token.utils");
const speakeasy_1 = __importDefault(require("speakeasy"));
class AuthService {
    static async register(data) {
        const existing = await (0, knex_1.default)('users').where({ email: data.email.toLowerCase() }).first();
        if (existing) {
            const error = new Error('An account with this email address already exists.');
            error.statusCode = 409;
            error.code = 'EMAIL_EXISTS';
            throw error;
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const [userIdRaw] = await (0, knex_1.default)('users').insert({
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            password_hash: passwordHash,
            is_email_verified: false,
            email_verification_token: verificationToken,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
        });
        const userId = typeof userIdRaw === 'object' ? userIdRaw.id || 1 : userIdRaw;
        const user = await (0, knex_1.default)('users').where({ id: userId }).first();
        const payload = { userId: user.id, email: user.email, name: user.name };
        const accessToken = (0, token_utils_1.generateAccessToken)(payload);
        const refreshToken = (0, token_utils_1.generateRefreshToken)(payload);
        // Store refresh token
        const tokenHash = (0, token_utils_1.hashToken)(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, knex_1.default)('refresh_tokens').insert({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
            is_revoked: false,
        });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isEmailVerified: !!user.is_email_verified,
                twoFactorEnabled: !!user.two_factor_enabled,
                avatarUrl: user.avatar_url,
            },
            accessToken,
            refreshToken,
            verificationToken, // Provided for easy mock verification/preview
        };
    }
    static async login(data) {
        const user = await (0, knex_1.default)('users').where({ email: data.email.toLowerCase().trim() }).first();
        if (!user) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password_hash);
        if (!isValidPassword) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            error.code = 'INVALID_CREDENTIALS';
            throw error;
        }
        // If 2FA is enabled for this user
        if (user.two_factor_enabled) {
            if (!data.twoFactorCode) {
                return {
                    requiresTwoFactor: true,
                    userId: user.id,
                    message: 'Two-Factor Authentication code required.',
                };
            }
            const verified = speakeasy_1.default.totp.verify({
                secret: user.two_factor_secret,
                encoding: 'base32',
                token: data.twoFactorCode,
                window: 1,
            });
            if (!verified) {
                const error = new Error('Invalid 2FA code. Please check your authenticator app.');
                error.statusCode = 401;
                error.code = 'INVALID_2FA_CODE';
                throw error;
            }
        }
        const payload = { userId: user.id, email: user.email, name: user.name };
        const accessToken = (0, token_utils_1.generateAccessToken)(payload);
        const refreshToken = (0, token_utils_1.generateRefreshToken)(payload);
        // Store refresh token
        const tokenHash = (0, token_utils_1.hashToken)(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, knex_1.default)('refresh_tokens').insert({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt,
            is_revoked: false,
        });
        return {
            requiresTwoFactor: false,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isEmailVerified: !!user.is_email_verified,
                twoFactorEnabled: !!user.two_factor_enabled,
                avatarUrl: user.avatar_url,
            },
            accessToken,
            refreshToken,
        };
    }
    static async refreshAccessToken(refreshToken) {
        try {
            const payload = (0, token_utils_1.verifyRefreshToken)(refreshToken);
            const tokenHash = (0, token_utils_1.hashToken)(refreshToken);
            const existingRecord = await (0, knex_1.default)('refresh_tokens')
                .where({ token_hash: tokenHash })
                .first();
            // Token reuse detection: if token exists but was already revoked, revoke all tokens for that user
            if (existingRecord && existingRecord.is_revoked) {
                await (0, knex_1.default)('refresh_tokens')
                    .where({ user_id: payload.userId, is_revoked: false })
                    .update({ is_revoked: true });
                const error = new Error('Suspicious activity detected: Refresh token was already used. All sessions revoked.');
                error.statusCode = 401;
                error.code = 'TOKEN_REUSE_DETECTED';
                throw error;
            }
            if (!existingRecord || new Date(existingRecord.expires_at) <= new Date()) {
                const error = new Error('Refresh token is invalid or has expired.');
                error.statusCode = 401;
                error.code = 'INVALID_REFRESH_TOKEN';
                throw error;
            }
            const user = await (0, knex_1.default)('users').where({ id: payload.userId }).first();
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 401;
                throw error;
            }
            // Invalidate the old refresh token (Rotation)
            await (0, knex_1.default)('refresh_tokens')
                .where({ id: existingRecord.id })
                .update({ is_revoked: true });
            // Generate new access token and rotated refresh token
            const newPayload = { userId: user.id, email: user.email, name: user.name };
            const newAccessToken = (0, token_utils_1.generateAccessToken)(newPayload);
            const newRefreshToken = (0, token_utils_1.generateRefreshToken)(newPayload);
            // Store the new rotated refresh token
            const newTokenHash = (0, token_utils_1.hashToken)(newRefreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await (0, knex_1.default)('refresh_tokens').insert({
                user_id: user.id,
                token_hash: newTokenHash,
                expires_at: expiresAt,
                is_revoked: false,
            });
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isEmailVerified: !!user.is_email_verified,
                    twoFactorEnabled: !!user.two_factor_enabled,
                    avatarUrl: user.avatar_url,
                },
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                const err = new Error('Refresh token expired. Please login again.');
                err.statusCode = 401;
                err.code = 'REFRESH_TOKEN_EXPIRED';
                throw err;
            }
            throw error;
        }
    }
    static async logout(refreshToken) {
        if (refreshToken) {
            const tokenHash = (0, token_utils_1.hashToken)(refreshToken);
            await (0, knex_1.default)('refresh_tokens').where({ token_hash: tokenHash }).update({ is_revoked: true });
        }
        return { message: 'Logged out successfully.' };
    }
    static async getProfile(userId) {
        const user = await (0, knex_1.default)('users').where({ id: userId }).first();
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: !!user.is_email_verified,
            twoFactorEnabled: !!user.two_factor_enabled,
            avatarUrl: user.avatar_url,
            createdAt: user.created_at,
        };
    }
    static async verifyEmail(token) {
        const user = await (0, knex_1.default)('users').where({ email_verification_token: token }).first();
        if (!user) {
            const error = new Error('Invalid or expired verification token.');
            error.statusCode = 400;
            error.code = 'INVALID_VERIFICATION_TOKEN';
            throw error;
        }
        await (0, knex_1.default)('users').where({ id: user.id }).update({
            is_email_verified: true,
            email_verification_token: null,
            updated_at: new Date(),
        });
        return { message: 'Email verified successfully!' };
    }
    static async generateEmailVerification(userId) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        await (0, knex_1.default)('users').where({ id: userId }).update({
            email_verification_token: token,
            updated_at: new Date(),
        });
        return {
            verificationToken: token,
            verificationUrl: `/verify-email?token=${token}`,
            message: 'Verification link generated.',
        };
    }
}
exports.AuthService = AuthService;
