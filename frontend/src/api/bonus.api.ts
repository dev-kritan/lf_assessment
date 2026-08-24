import apiClient from './client';
import { BonusTableData, BonusQueryResult, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

export const bonusApi = {
  async getBonusData() {
    const response = await apiClient.get<ApiResponse<BonusTableData>>(API_ENDPOINTS.BONUS.DATA);
    return response.data;
  },

  async runQ1() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>(API_ENDPOINTS.BONUS.Q1);
    return response.data;
  },

  async runQ2() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>(API_ENDPOINTS.BONUS.Q2);
    return response.data;
  },

  async runQ4() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>(API_ENDPOINTS.BONUS.Q4);
    return response.data;
  },
};
