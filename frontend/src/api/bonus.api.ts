import apiClient from './client';
import { BonusTableData, BonusQueryResult, ApiResponse } from '../types';

export const bonusApi = {
  async getBonusData() {
    const response = await apiClient.get<ApiResponse<BonusTableData>>('/bonus/data');
    return response.data;
  },

  async runQ1() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>('/bonus/q1');
    return response.data;
  },

  async runQ2() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>('/bonus/q2');
    return response.data;
  },

  async runQ4() {
    const response = await apiClient.get<ApiResponse<BonusQueryResult>>('/bonus/q4');
    return response.data;
  },
};
