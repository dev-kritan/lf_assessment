export const APP_ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  EVENT_DETAIL_PATTERN: '/events/:id',
  EVENT_DETAIL: (id: number | string) => `/events/${id}`,
  CREATE_EVENT: '/create-event',
  MY_EVENTS: '/my-events',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  VERIFY_EMAIL: '/verify-email',
  BONUS_CHALLENGE: '/bonus-challenge',
} as const;
