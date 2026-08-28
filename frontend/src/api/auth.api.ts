import apiClient from './client';
import { User, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export const authApi = {
  async register(data: { name: string; email: string; password: string }) {
    const response = await apiClient.post<ApiResponse<{ user: User; message: string; verificationToken?: string }>>(
      API_ENDPOINTS.AUTH.REGISTER,
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
    }>>(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  async logout(refreshToken?: string) {
    const response = await apiClient.post<ApiResponse>(API_ENDPOINTS.AUTH.LOGOUT, refreshToken ? { refreshToken } : {});
    return response.data;
  },

  async verifyEmail(token: string, uid?: number | string) {
    const response = await apiClient.post<ApiResponse<{ alreadyVerified?: boolean; message: string }>>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token, uid: uid ? Number(uid) : undefined }
    );
    return response.data;
  },

  async resendVerification(email: string) {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email }
    );
    return response.data;
  },

  async requestVerificationLink() {
    const response = await apiClient.post<ApiResponse<{ verificationToken: string; verificationUrl: string }>>(
      API_ENDPOINTS.AUTH.REQUEST_VERIFICATION
    );
    return response.data;
  },

  async setup2FA() {
    const response = await apiClient.post<ApiResponse<{ secret: string; qrCode: string; otpAuthUrl: string }>>(
      API_ENDPOINTS.TWO_FACTOR.SETUP
    );
    return response.data;
  },

  async enable2FA(token: string) {
    const response = await apiClient.post<ApiResponse>(API_ENDPOINTS.TWO_FACTOR.ENABLE, { token });
    return response.data;
  },

  async disable2FA(token: string) {
    const response = await apiClient.post<ApiResponse>(API_ENDPOINTS.TWO_FACTOR.DISABLE, { token });
    return response.data;
  },
};
