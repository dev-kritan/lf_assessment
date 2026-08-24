import apiClient from './client';
import { EventItem, Tag, TagUsageData, ApiResponse, EventQueryParams } from '../types';
import { API_ENDPOINTS } from '../constants';

export const eventsApi = {
  async getEvents(params: EventQueryParams = {}) {
    const response = await apiClient.get<ApiResponse<EventItem[]>>(API_ENDPOINTS.EVENTS.BASE, { params });
    return response.data;
  },

  async getEventById(id: number) {
    const response = await apiClient.get<ApiResponse<EventItem>>(API_ENDPOINTS.EVENTS.DETAIL(id));
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
    const response = await apiClient.post<ApiResponse<EventItem>>(API_ENDPOINTS.EVENTS.BASE, data);
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
    const response = await apiClient.put<ApiResponse<EventItem>>(API_ENDPOINTS.EVENTS.DETAIL(id), data);
    return response.data;
  },

  async deleteEvent(id: number) {
    const response = await apiClient.delete<ApiResponse>(API_ENDPOINTS.EVENTS.DETAIL(id));
    return response.data;
  },

  async getMetrics() {
    const response = await apiClient.get<ApiResponse<{
      totalEvents: number;
      upcomingEvents: number;
      pastEvents: number;
      totalRsvps: number;
      totalTags: number;
    }>>(API_ENDPOINTS.EVENTS.METRICS);
    return response.data;
  },

  async getTags(params?: { event_type?: string; timeframe?: string; search?: string }) {
    const response = await apiClient.get<ApiResponse<Tag[]>>(API_ENDPOINTS.TAGS.BASE, { params });
    return response.data;
  },

  async createTag(name: string, colorHex?: string) {
    const response = await apiClient.post<ApiResponse<Tag>>(API_ENDPOINTS.TAGS.BASE, { name, colorHex });
    return response.data;
  },

  async getTagUsage(id: number) {
    const response = await apiClient.get<ApiResponse<TagUsageData>>(API_ENDPOINTS.TAGS.USAGE(id));
    return response.data;
  },

  async updateTag(id: number, data: { name?: string; colorHex?: string }) {
    const response = await apiClient.put<ApiResponse<Tag>>(API_ENDPOINTS.TAGS.DETAIL(id), data);
    return response.data;
  },

  async deleteTag(id: number) {
    const response = await apiClient.delete<ApiResponse<{ deletedTag: Tag; affectedEventsCount: number }>>(API_ENDPOINTS.TAGS.DETAIL(id));
    return response.data;
  },
};

