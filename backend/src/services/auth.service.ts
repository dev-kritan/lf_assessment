import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../config/knex';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/token.utils';
import speakeasy from 'speakeasy';
import { DB_TABLES, ERROR_CODES, AUTH_CONFIG, TOKEN_DURATIONS } from '../constants';

export class AuthService {
  static async register(data: { name: string; email: string; password: string }) {
    const existing = await db(DB_TABLES.USERS).where({ email: data.email.toLowerCase() }).first();
    if (existing) {
      const error: any = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      error.code = ERROR_CODES.EMAIL_EXISTS;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, AUTH_CONFIG.SALT_ROUNDS);
    const verificationToken = crypto.randomBytes(AUTH_CONFIG.VERIFICATION_TOKEN_BYTES).toString('hex');

    const [userIdRaw] = await db(DB_TABLES.USERS).insert({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password_hash: passwordHash,
      is_email_verified: false,
      email_verification_token: verificationToken,
      avatar_url: `${AUTH_CONFIG.DEFAULT_AVATAR_BASE_URL}${encodeURIComponent(data.name)}`,
    });

    const userId = typeof userIdRaw === 'object' ? (userIdRaw as any).id || 1 : userIdRaw;
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();

    const payload = { userId: user.id, email: user.email, name: user.name };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + TOKEN_DURATIONS.REFRESH_TOKEN_MS);
    await db(DB_TABLES.REFRESH_TOKENS).insert({
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

  static async login(data: { email: string; password: string; twoFactorCode?: string }) {
    const user = await db(DB_TABLES.USERS).where({ email: data.email.toLowerCase().trim() }).first();
    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = ERROR_CODES.INVALID_CREDENTIALS;
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

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: AUTH_CONFIG.TOTP_WINDOW,
      });

      if (!verified) {
        const error: any = new Error('Invalid 2FA code. Please check your authenticator app.');
        error.statusCode = 401;
        error.code = ERROR_CODES.INVALID_2FA_CODE;
        throw error;
      }
    }

    const payload = { userId: user.id, email: user.email, name: user.name };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + TOKEN_DURATIONS.REFRESH_TOKEN_MS);
    await db(DB_TABLES.REFRESH_TOKENS).insert({
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

  static async refreshAccessToken(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);

      const existingRecord = await db(DB_TABLES.REFRESH_TOKENS)
        .where({ token_hash: tokenHash })
        .first();

      // Token reuse detection: if token exists but was already revoked, revoke all tokens for that user
      if (existingRecord && existingRecord.is_revoked) {
        await db(DB_TABLES.REFRESH_TOKENS)
          .where({ user_id: payload.userId, is_revoked: false })
          .update({ is_revoked: true });

        const error: any = new Error('Suspicious activity detected: Refresh token was already used. All sessions revoked.');
        error.statusCode = 401;
        error.code = ERROR_CODES.TOKEN_REUSE_DETECTED;
        throw error;
      }

      if (!existingRecord || new Date(existingRecord.expires_at) <= new Date()) {
        const error: any = new Error('Refresh token is invalid or has expired.');
        error.statusCode = 401;
        error.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
        throw error;
      }

      const user = await db(DB_TABLES.USERS).where({ id: payload.userId }).first();
      if (!user) {
        const error: any = new Error('User not found.');
        error.statusCode = 401;
        throw error;
      }

      // Invalidate the old refresh token (Rotation)
      await db(DB_TABLES.REFRESH_TOKENS)
        .where({ id: existingRecord.id })
        .update({ is_revoked: true });

      // Generate new access token and rotated refresh token
      const newPayload = { userId: user.id, email: user.email, name: user.name };
      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // Store the new rotated refresh token
      const newTokenHash = hashToken(newRefreshToken);
      const expiresAt = new Date(Date.now() + TOKEN_DURATIONS.REFRESH_TOKEN_MS);
      await db(DB_TABLES.REFRESH_TOKENS).insert({
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
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        const err: any = new Error('Refresh token expired. Please login again.');
        err.statusCode = 401;
        err.code = ERROR_CODES.REFRESH_TOKEN_EXPIRED;
        throw err;
      }
      throw error;
    }
  }

  static async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db(DB_TABLES.REFRESH_TOKENS).where({ token_hash: tokenHash }).update({ is_revoked: true });
    }
    return { message: 'Logged out successfully.' };
  }

  static async getProfile(userId: number) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user) {
      const error: any = new Error('User not found.');
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

  static async verifyEmail(token: string) {
    const user = await db(DB_TABLES.USERS).where({ email_verification_token: token }).first();
    if (!user) {
      const error: any = new Error('Invalid or expired verification token.');
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_VERIFICATION_TOKEN;
      throw error;
    }

    await db(DB_TABLES.USERS).where({ id: user.id }).update({
      is_email_verified: true,
      email_verification_token: null,
      updated_at: new Date(),
    });

    return { message: 'Email verified successfully!' };
  }

  static async generateEmailVerification(userId: number) {
    const token = crypto.randomBytes(AUTH_CONFIG.VERIFICATION_TOKEN_BYTES).toString('hex');
    await db(DB_TABLES.USERS).where({ id: userId }).update({
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
