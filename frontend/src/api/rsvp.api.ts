import apiClient from './client';
import { Attendee, ApiResponse, RsvpStats } from '../types';
import { API_ENDPOINTS } from '../constants';

export const rsvpApi = {
  async setRsvp(eventId: number, status: 'yes' | 'maybe' | 'no') {
    const response = await apiClient.post<ApiResponse<{
      status: 'yes' | 'maybe' | 'no';
      rsvpStats: RsvpStats;
      message: string;
    }>>(API_ENDPOINTS.RSVPS.SET(eventId), { status });
    return response.data;
  },

  async getAttendees(eventId: number) {
    const response = await apiClient.get<ApiResponse<Attendee[]>>(API_ENDPOINTS.RSVPS.ATTENDEES(eventId));
    return response.data;
  },

  async getMyRsvps() {
    const response = await apiClient.get<ApiResponse<any[]>>(API_ENDPOINTS.RSVPS.MY_RSVPS);
    return response.data;
  },

  async deleteRsvp(eventId: number) {
    const response = await apiClient.delete<ApiResponse>(API_ENDPOINTS.RSVPS.DELETE(eventId));
    return response.data;
  },

  async bulkDeleteRsvps(eventIds: number[]) {
    const response = await apiClient.post<ApiResponse<{ removedCount: number; eventIds: number[] }>>(
      API_ENDPOINTS.RSVPS.BULK_DELETE,
      { event_ids: eventIds }
    );
    return response.data;
  },
};

