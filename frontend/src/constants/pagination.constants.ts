export const PAGINATION_LIMITS = {
  EVENT_LIST_DEFAULT: 9,
  MY_EVENTS_DEFAULT: 6,
  METRIC_DRAWER_DEFAULT: 10,
} as const;

export const PER_PAGE_OPTIONS = [
  { value: 6, label: '6 / page' },
  { value: 9, label: '9 / page' },
  { value: 15, label: '15 / page' },
  { value: 30, label: '30 / page' },
] as const;
