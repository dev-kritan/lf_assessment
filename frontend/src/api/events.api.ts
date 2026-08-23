import apiClient from './client';
import { EventItem, Tag, TagUsageData, ApiResponse, EventQueryParams } from '../types';

export const eventsApi = {
  async getEvents(params: EventQueryParams = {}) {
    const response = await apiClient.get<ApiResponse<EventItem[]>>('/events', { params });
    return response.data;
  },

  async getEventById(id: number) {
    const response = await apiClient.get<ApiResponse<EventItem>>(`/events/${id}`);
    return response.data;
  },

  async createEvent(data: {
    title: string;
    description: string;
    location: string;
    event_type: 'public' | 'private';
    start_time: string;
    end_time?: string | null;
    capacity?: number | null;
    banner_url?: string | null;
    tag_ids?: number[];
    new_tags?: string[];
  }) {
    const response = await apiClient.post<ApiResponse<EventItem>>('/events', data);
    return response.data;
  },

  async updateEvent(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      location: string;
      event_type: 'public' | 'private';
      start_time: string;
      end_time?: string | null;
      capacity?: number | null;
      banner_url?: string | null;
      tag_ids?: number[];
      new_tags?: string[];
    }>
  ) {
    const response = await apiClient.put<ApiResponse<EventItem>>(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: number) {
    const response = await apiClient.delete<ApiResponse>(`/events/${id}`);
    return response.data;
  },

  async getMetrics() {
    const response = await apiClient.get<ApiResponse<{
      totalEvents: number;
      upcomingEvents: number;
      pastEvents: number;
      totalRsvps: number;
      totalTags: number;
    }>>('/events/metrics');
    return response.data;
  },

  async getTags(params?: { event_type?: string; timeframe?: string; search?: string }) {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags', { params });
    return response.data;
  },

  async createTag(name: string, colorHex?: string) {
    const response = await apiClient.post<ApiResponse<Tag>>('/tags', { name, colorHex });
    return response.data;
  },

  async getTagUsage(id: number) {
    const response = await apiClient.get<ApiResponse<TagUsageData>>(`/tags/${id}/usage`);
    return response.data;
  },

  async updateTag(id: number, data: { name?: string; colorHex?: string }) {
    const response = await apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, data);
    return response.data;
  },

  async deleteTag(id: number) {
    const response = await apiClient.delete<ApiResponse<{ deletedTag: Tag; affectedEventsCount: number }>>(`/tags/${id}`);
    return response.data;
  },
};

