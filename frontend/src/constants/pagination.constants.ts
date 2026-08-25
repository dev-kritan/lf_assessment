export const PAGINATION_LIMITS = {
  EVENT_LIST_DEFAULT: 6,
  MY_EVENTS_DEFAULT: 6,
  METRIC_DRAWER_DEFAULT: 10,
} as const;

export const PER_PAGE_OPTIONS = [
  { value: 3, label: '3 / page' },
  { value: 6, label: '6 / page' },
  { value: 9, label: '9 / page' },
  { value: 12, label: '12 / page' },
  { value: 24, label: '24 / page' },
] as const;
