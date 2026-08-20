import apiClient from './client';
import { User, ApiResponse } from '../types';

export const authApi = {
  async register(data: { name: string; email: string; password: string }) {
    const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string; verificationToken: string }>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  async login(data: { email: string; password: string; twoFactorCode?: string }) {
    const response = await apiClient.post<ApiResponse<{
      requiresTwoFactor?: boolean;
      userId?: number;
      user?: User;
      accessToken?: string;
      refreshToken?: string;
    }>>('/auth/login', data);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  },

  async logout(refreshToken?: string) {
    const response = await apiClient.post<ApiResponse>('/auth/logout', refreshToken ? { refreshToken } : {});
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.post<ApiResponse>('/auth/verify-email', { token });
    return response.data;
  },

  async requestVerificationLink() {
    const response = await apiClient.post<ApiResponse<{ verificationToken: string; verificationUrl: string }>>(
      '/auth/request-verification'
    );
    return response.data;
  },

  async setup2FA() {
    const response = await apiClient.post<ApiResponse<{ secret: string; qrCode: string; otpAuthUrl: string }>>(
      '/2fa/setup'
    );
    return response.data;
  },

  async enable2FA(token: string) {
    const response = await apiClient.post<ApiResponse>('/2fa/enable', { token });
    return response.data;
  },

  async disable2FA(token: string) {
    const response = await apiClient.post<ApiResponse>('/2fa/disable', { token });
    return response.data;
  },
};
