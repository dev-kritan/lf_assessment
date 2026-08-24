export const DB_TABLES = {
  USERS: 'users',
  EVENTS: 'events',
  TAGS: 'tags',
  EVENT_TAGS: 'event_tags',
  RSVPS: 'rsvps',
  REFRESH_TOKENS: 'refresh_tokens',
  EMP_DESIGNATION_LOG: 'emp_designation_log',
  EMP_ALLOCATION_LOG: 'emp_allocation_log',
} as const;

export type DbTable = (typeof DB_TABLES)[keyof typeof DB_TABLES];
