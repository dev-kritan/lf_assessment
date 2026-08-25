export const API_BASE_URL = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    REQUEST_VERIFICATION: '/auth/request-verification',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  TWO_FACTOR: {
    SETUP: '/auth/2fa/setup',
    ENABLE: '/auth/2fa/enable',
    DISABLE: '/auth/2fa/disable',
  },
  EVENTS: {
    BASE: '/events',
    DETAIL: (id: number | string) => `/events/${id}`,
    METRICS: '/events/metrics',
    ATTENDEES: (id: number | string) => `/events/${id}/attendees`,
    RSVPS: (id: number | string) => `/events/${id}/rsvps`,
  },
  TAGS: {
    BASE: '/tags',
    DETAIL: (id: number | string) => `/tags/${id}`,
    USAGE: (id: number | string) => `/tags/${id}/usage`,
  },
  RSVPS: {
    BASE: '/rsvps',
    SET: (eventId: number | string) => `/events/${eventId}/rsvps`,
    ATTENDEES: (eventId: number | string) => `/events/${eventId}/attendees`,
    MY_RSVPS: '/rsvps/me',
  },
  BONUS: {
    DATA: '/bonus/data',
    Q1: '/bonus/q1',
    Q2: '/bonus/q2',
    Q4: '/bonus/q4',
  },
} as const;
