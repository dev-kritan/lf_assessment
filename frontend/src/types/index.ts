export interface User {
  id: number;
  name: string;
  email: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Tag {
  id: number;
  name: string;
  colorHex: string;
  eventCount?: number;
}

export interface AssociatedEvent {
  id: number;
  title: string;
  eventType: 'public' | 'private';
  startTime: string;
  location?: string;
  isTruePrivate?: boolean;
}

export interface TagUsageData {
  tag: Tag;
  eventCount: number;
  associatedEvents: AssociatedEvent[];
}

export interface RsvpStats {
  yes: number;
  maybe: number;
  no: number;
  total: number;
}

export interface Attendee {
  id: number;
  name: string;
  avatarUrl?: string;
  status: 'yes' | 'maybe' | 'no';
  updatedAt: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  location: string;
  eventType: 'public' | 'private';
  isTruePrivate?: boolean;
  startTime: string;
  endTime?: string | null;
  capacity?: number | null;
  bannerUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isPast: boolean;
  creator: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  tags: Tag[];
  rsvpStats: RsvpStats;
  userRsvp?: 'yes' | 'maybe' | 'no' | null;
  isCreator: boolean;
  isRestricted?: boolean;
  attendees?: Attendee[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  tag_id?: number;
  event_type?: 'all' | 'public' | 'private';
  timeframe?: 'all' | 'upcoming' | 'past';
  sort_by?: 'date' | 'popularity' | 'created_at';
  sort_order?: 'asc' | 'desc';
  creator_id?: number;
  my_rsvps?: 'all' | 'yes' | 'maybe' | 'no';
}

export interface BonusTableData {
  empDesignationLog: Array<{
    txn_id: string;
    emp_id: string;
    emp_name: string;
    designation: string;
    effective_date: string;
  }>;
  empAllocationLog: Array<{
    allocation_id: string;
    emp_id: string;
    project_name: string;
    allocated_role: string;
    allocation_start: string;
    allocation_end: string | null;
  }>;
}

export interface BonusQueryResult {
  question: string;
  sql: string;
  rows: any[];
  count: number;
}
