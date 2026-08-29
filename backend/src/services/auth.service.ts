import bcrypt from "bcryptjs";
import crypto from "crypto";
import speakeasy from "speakeasy";
import { config } from "../config/env";
import db from "../config/knex";
import {
  AUTH_CONFIG,
  DB_TABLES,
  ERROR_CODES,
  TOKEN_DURATIONS,
} from "../constants";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../utils/token.utils";
import { EmailService } from "./email.service";

export class AuthService {
  static async register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await db(DB_TABLES.USERS)
      .where({ email: normalizedEmail })
      .first();
    if (existing) {
      const error: any = new Error(
        "An account with this email address already exists.",
      );
      error.statusCode = 409;
      error.code = ERROR_CODES.EMAIL_EXISTS;
      throw error;
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      AUTH_CONFIG.SALT_ROUNDS,
    );

    // 1. Generate secure random 32-byte token
    const rawVerificationToken = crypto
      .randomBytes(AUTH_CONFIG.VERIFICATION_TOKEN_BYTES)
      .toString("hex");

    // 2. Hash with SHA-256 before storing in DB
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    // 3. Set token expiry to 24 hours from now
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_DURATIONS.VERIFICATION_TOKEN_MS,
    );

    const [userIdRaw] = await db(DB_TABLES.USERS).insert({
      name: data.name.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      is_email_verified: false,
      email_verification_token: hashedVerificationToken,
      verification_token_expires_at: tokenExpiresAt,
      avatar_url: `${AUTH_CONFIG.DEFAULT_AVATAR_BASE_URL}${encodeURIComponent(data.name.trim())}`,
    });

    const userId =
      typeof userIdRaw === "object" ? (userIdRaw as any).id || 1 : userIdRaw;
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();

    // 4. Send verification email with link containing rawToken and uid
    const verificationUrl = `${config.clientUrl}/verify-email?token=${rawVerificationToken}&uid=${user.id}`;
    await EmailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
      rawToken: rawVerificationToken,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: false,
        twoFactorEnabled: !!user.two_factor_enabled,
        avatarUrl: user.avatar_url,
      },
      message:
        "Registration successful. A verification email has been sent to your inbox.",
      verificationToken: rawVerificationToken, // Provided in response for easy testing / preview environments
    };
  }

  static async login(data: {
    email: string;
    password: string;
    twoFactorCode?: string;
  }) {
    const user = await db(DB_TABLES.USERS)
      .where({ email: data.email.toLowerCase().trim() })
      .first();
    if (!user) {
      const error: any = new Error("Invalid email or password.");
      error.statusCode = 401;
      error.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.password_hash,
    );
    if (!isValidPassword) {
      const error: any = new Error("Invalid email or password.");
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
          message: "Two-Factor Authentication code required.",
        };
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: data.twoFactorCode,
        window: AUTH_CONFIG.TOTP_WINDOW,
      });

      if (!verified) {
        const error: any = new Error(
          "Invalid 2FA code. Please check your authenticator app.",
        );
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
        isEmailVerified: Boolean(user.is_email_verified),
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

        const error: any = new Error(
          "Suspicious activity detected: Refresh token was already used. All sessions revoked.",
        );
        error.statusCode = 401;
        error.code = ERROR_CODES.TOKEN_REUSE_DETECTED;
        throw error;
      }

      if (
        !existingRecord ||
        new Date(existingRecord.expires_at) <= new Date()
      ) {
        const error: any = new Error(
          "Refresh token is invalid or has expired.",
        );
        error.statusCode = 401;
        error.code = ERROR_CODES.INVALID_REFRESH_TOKEN;
        throw error;
      }

      const user = await db(DB_TABLES.USERS)
        .where({ id: payload.userId })
        .first();
      if (!user) {
        const error: any = new Error("User not found.");
        error.statusCode = 401;
        throw error;
      }

      // Invalidate the old refresh token (Rotation)
      await db(DB_TABLES.REFRESH_TOKENS)
        .where({ id: existingRecord.id })
        .update({ is_revoked: true });

      // Generate new access token and rotated refresh token
      const newPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
      };
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
      if (error.name === "TokenExpiredError") {
        const err: any = new Error(
          "Refresh token expired. Please login again.",
        );
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
      await db(DB_TABLES.REFRESH_TOKENS)
        .where({ token_hash: tokenHash })
        .update({ is_revoked: true });
    }
    return { message: "Logged out successfully." };
  }

  static async getProfile(userId: number) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user) {
      const error: any = new Error("User not found.");
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

  /**
   * Verifies an email token for a user.
   * Compares SHA-256 hash, validates 24h expiration, handles already-verified users gracefully,
   * and invalidates single-use token on success.
   */
  static async verifyEmail(token: string, uid?: number) {
    if (!token || typeof token !== "string") {
      const error: any = new Error("Verification token is required.");
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_VERIFICATION_TOKEN;
      throw error;
    }

    let user: any = null;

    if (uid) {
      user = await db(DB_TABLES.USERS).where({ id: uid }).first();
    }

    // If uid was not provided or user not found by uid, compute incoming hash and search by token hash
    const incomingTokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");
    if (!user) {
      user = await db(DB_TABLES.USERS)
        .where({ email_verification_token: incomingTokenHash })
        .first();
    }

    if (!user) {
      const error: any = new Error("Invalid or expired verification token.");
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_VERIFICATION_TOKEN;
      throw error;
    }

    // Step 7: Gracefully handle already-verified users clicking old links
    if (user.is_email_verified) {
      return {
        alreadyVerified: true,
        message:
          "Your email address is already verified. You can sign in to your account.",
      };
    }

    if (!user.email_verification_token) {
      const error: any = new Error("Invalid or expired verification token.");
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_VERIFICATION_TOKEN;
      throw error;
    }

    // Check token expiry (24 hours)
    if (
      user.verification_token_expires_at &&
      new Date(user.verification_token_expires_at) < new Date()
    ) {
      const error: any = new Error(
        "Verification link has expired. Please request a new verification link.",
      );
      error.statusCode = 400;
      error.code = ERROR_CODES.VERIFICATION_TOKEN_EXPIRED;
      throw error;
    }

    // Timing-safe constant-time hash comparison
    const storedBuffer = Buffer.from(user.email_verification_token, "hex");
    const incomingBuffer = Buffer.from(incomingTokenHash, "hex");

    if (
      storedBuffer.length !== incomingBuffer.length ||
      !crypto.timingSafeEqual(storedBuffer, incomingBuffer)
    ) {
      const error: any = new Error("Invalid verification token.");
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_VERIFICATION_TOKEN;
      throw error;
    }

    // Single-use token: invalidate token and set verified = true
    await db(DB_TABLES.USERS).where({ id: user.id }).update({
      is_email_verified: true,
      email_verification_token: null,
      verification_token_expires_at: null,
      updated_at: new Date(),
    });

    return {
      alreadyVerified: false,
      message: "Email verified successfully! You can now log in.",
    };
  }

  /**
   * Resends verification email.
   * Generates new SHA-256 hashed token + 24-hour expiry.
   * Returns a generic response to prevent account enumeration.
   */
  static async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await db(DB_TABLES.USERS)
      .where({ email: normalizedEmail })
      .first();

    if (user && !user.is_email_verified) {
      console.log("user is not email verified");
      const rawVerificationToken = crypto
        .randomBytes(AUTH_CONFIG.VERIFICATION_TOKEN_BYTES)
        .toString("hex");
      const hashedVerificationToken = crypto
        .createHash("sha256")
        .update(rawVerificationToken)
        .digest("hex");
      const tokenExpiresAt = new Date(
        Date.now() + TOKEN_DURATIONS.VERIFICATION_TOKEN_MS,
      );

      await db(DB_TABLES.USERS).where({ id: user.id }).update({
        email_verification_token: hashedVerificationToken,
        verification_token_expires_at: tokenExpiresAt,
        updated_at: new Date(),
      });

      const verificationUrl = `${config.clientUrl}/verify-email?token=${rawVerificationToken}&uid=${user.id}`;

      console.log({ verificationUrl });

      await EmailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
        rawToken: rawVerificationToken,
      });
    }

    // Always return generic response to prevent leaking account existence
    return {
      message:
        "If an account with that email exists and is unverified, a verification link has been sent.",
    };
  }

  static async generateEmailVerification(userId: number) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user) {
      const error: any = new Error("User not found.");
      error.statusCode = 404;
      throw error;
    }

    const rawVerificationToken = crypto
      .randomBytes(AUTH_CONFIG.VERIFICATION_TOKEN_BYTES)
      .toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_DURATIONS.VERIFICATION_TOKEN_MS,
    );

    await db(DB_TABLES.USERS).where({ id: userId }).update({
      email_verification_token: hashedVerificationToken,
      verification_token_expires_at: tokenExpiresAt,
      updated_at: new Date(),
    });

    const verificationUrl = `${config.clientUrl}/verify-email?token=${rawVerificationToken}&uid=${userId}`;
    await EmailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
      rawToken: rawVerificationToken,
    });

    return {
      verificationToken: rawVerificationToken,
      verificationUrl,
      message: "Verification link generated and sent.",
    };
  }
}
