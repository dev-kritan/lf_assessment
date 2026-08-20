import apiClient from './client';
import { Attendee, ApiResponse, RsvpStats } from '../types';

export const rsvpApi = {
  async setRsvp(eventId: number, status: 'yes' | 'maybe' | 'no') {
    const response = await apiClient.post<ApiResponse<{
      status: 'yes' | 'maybe' | 'no';
      rsvpStats: RsvpStats;
      message: string;
    }>>(`/rsvps/events/${eventId}`, { status });
    return response.data;
  },

  async getAttendees(eventId: number) {
    const response = await apiClient.get<ApiResponse<Attendee[]>>(`/rsvps/events/${eventId}/attendees`);
    return response.data;
  },

  async getMyRsvps() {
    const response = await apiClient.get<ApiResponse<any[]>>('/rsvps/my-rsvps');
    return response.data;
  },
};
