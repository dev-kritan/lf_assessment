import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import db from '../config/knex';
import { config } from '../config/env';
import { DB_TABLES, ERROR_CODES, AUTH_CONFIG } from '../constants';

export class TwoFactorService {
  static async generateSecret(userId: number) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user) {
      const error: any = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    const secret = speakeasy.generateSecret({
      name: `${config.appName} (${user.email})`,
      issuer: config.appName,
      length: AUTH_CONFIG.TOTP_SECRET_LENGTH,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Save temporary secret until verified
    await db(DB_TABLES.USERS).where({ id: userId }).update({
      two_factor_secret: secret.base32,
      updated_at: new Date(),
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpAuthUrl: secret.otpauth_url,
    };
  }

  static async verifyAndEnable(userId: number, token: string) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user || !user.two_factor_secret) {
      const error: any = new Error('Two-factor setup has not been initiated.');
      error.statusCode = 400;
      throw error;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: AUTH_CONFIG.TOTP_WINDOW,
    });

    if (!verified) {
      const error: any = new Error('Invalid authentication code. Please try again.');
      error.statusCode = 400;
      error.code = ERROR_CODES.INVALID_2FA_CODE;
      throw error;
    }

    await db(DB_TABLES.USERS).where({ id: userId }).update({
      two_factor_enabled: true,
      updated_at: new Date(),
    });

    return {
      success: true,
      message: 'Two-Factor Authentication successfully enabled on your account.',
    };
  }

  static async disable(userId: number, token: string) {
    const user = await db(DB_TABLES.USERS).where({ id: userId }).first();
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      const error: any = new Error('2FA is not currently enabled on this account.');
      error.statusCode = 400;
      throw error;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: AUTH_CONFIG.TOTP_WINDOW,
    });

    if (!verified) {
      const error: any = new Error('Invalid authentication code. Unable to disable 2FA.');
      error.statusCode = 400;
      throw error;
    }

    await db(DB_TABLES.USERS).where({ id: userId }).update({
      two_factor_enabled: false,
      two_factor_secret: null,
      updated_at: new Date(),
    });

    return {
      success: true,
      message: 'Two-Factor Authentication has been disabled.',
    };
  }
}
