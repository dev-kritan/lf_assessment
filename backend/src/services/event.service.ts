import db from '../config/knex';
import { TagService } from './tag.service';

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

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  event_type: 'public' | 'private';
  is_true_private?: boolean;
  start_time: string;
  end_time?: string | null;
  capacity?: number | null;
  banner_url?: string | null;
  tag_ids?: number[];
  new_tags?: string[];
}

export class EventService {
  static async getEvents(params: EventQueryParams, currentUserId?: number) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 9)));
    const offset = (page - 1) * limit;

    const baseQuery = db('events')
      .leftJoin('users', 'events.creator_id', 'users.id')
      .select(
        'events.id',
        'events.title',
        'events.description',
        'events.location',
        'events.event_type',
        'events.is_true_private',
        'events.start_time',
        'events.end_time',
        'events.capacity',
        'events.banner_url',
        'events.created_at',
        'events.updated_at',
        'users.id as creator_id',
        'users.name as creator_name',
        'users.email as creator_email',
        'users.avatar_url as creator_avatar'
      );

    // True Private events policy:
    // If not authenticated, true private events cannot be viewed in the event list.
    // Public events and standard private events (with is_true_private = false) ARE viewable.
    if (!currentUserId) {
      baseQuery.where((builder) => {
        builder
          .where('events.is_true_private', false)
          .orWhereNull('events.is_true_private');
      });
    }

    // Filter by Event Type (if explicitly specified)
    if (params.event_type && params.event_type !== 'all') {
      baseQuery.where('events.event_type', params.event_type);
    }

    // Filter by Timeframe (upcoming vs past)
    const nowDate = new Date();
    if (params.timeframe === 'upcoming') {
      baseQuery.where('events.start_time', '>=', nowDate);
    } else if (params.timeframe === 'past') {
      baseQuery.where('events.start_time', '<', nowDate);
    }

    // Search by title, description, or location
    if (params.search && params.search.trim()) {
      const searchTerm = `%${params.search.trim()}%`;
      baseQuery.where((builder) => {
        builder
          .where('events.title', 'like', searchTerm)
          .orWhere('events.description', 'like', searchTerm)
          .orWhere('events.location', 'like', searchTerm);
      });
    }

    // Filter by creator
    if (params.creator_id) {
      baseQuery.where('events.creator_id', params.creator_id);
    }

    // Filter by tag
    if (params.tag_id) {
      baseQuery.whereExists(function () {
        this.select('*')
          .from('event_tags')
          .whereRaw('event_tags.event_id = events.id')
          .where('event_tags.tag_id', params.tag_id);
      });
    } else if (params.tag && params.tag.trim()) {
      baseQuery.whereExists(function () {
        this.select('*')
          .from('event_tags')
          .join('tags', 'event_tags.tag_id', 'tags.id')
          .whereRaw('event_tags.event_id = events.id')
          .whereRaw('LOWER(tags.name) = ?', [params.tag!.trim().toLowerCase()]);
      });
    }

    // Filter by user's RSVPs
    if (params.my_rsvps && currentUserId) {
      baseQuery.whereExists(function () {
        const sub = this.select('*')
          .from('rsvps')
          .whereRaw('rsvps.event_id = events.id')
          .where('rsvps.user_id', currentUserId);
        if (params.my_rsvps !== 'all') {
          sub.where('rsvps.status', params.my_rsvps);
        }
      });
    }

    // Count total before pagination
    const countQuery = db('events')
      .modify((qb) => {
        // Clone where conditions
        (baseQuery as any)._statements.forEach((st: any) => {
          if (st.grouping === 'where') {
            qb.where(st);
          }
        });
      });
    
    // Perform counting directly using a subquery wrapper for safety
    const totalResult = await db.from(baseQuery.clone().clearSelect().select('events.id').as('filtered_events')).count('* as count').first();
    const total = Number(totalResult?.count || 0);

    // Sorting
    const sortOrder = (params.sort_order || (params.timeframe === 'past' ? 'desc' : 'asc')).toLowerCase() as 'asc' | 'desc';
    if (params.sort_by === 'popularity') {
      // Sort by RSVP Yes count
      baseQuery
        .select(
          db.raw(
            '(SELECT COUNT(*) FROM rsvps WHERE rsvps.event_id = events.id AND rsvps.status = "yes") as rsvp_yes_count'
          )
        )
        .orderBy('rsvp_yes_count', sortOrder)
        .orderBy('events.start_time', 'asc');
    } else if (params.sort_by === 'created_at') {
      baseQuery.orderBy('events.created_at', sortOrder);
    } else {
      // Default: sort by start_time
      baseQuery.orderBy('events.start_time', sortOrder);
    }

    // Pagination
    const events = await baseQuery.limit(limit).offset(offset);

    // Fetch tags and RSVP stats for each event
    const eventIds = events.map((e) => e.id);
    let eventTagsMap: Record<number, any[]> = {};
    let rsvpStatsMap: Record<number, { yes: number; maybe: number; no: number; total: number }> = {};
    let userRsvpMap: Record<number, string> = {};

    if (eventIds.length > 0) {
      // Fetch tags
      const tags = await db('event_tags')
        .join('tags', 'event_tags.tag_id', 'tags.id')
        .whereIn('event_tags.event_id', eventIds)
        .select('event_tags.event_id', 'tags.id', 'tags.name', 'tags.color_hex');

      tags.forEach((t: any) => {
        const eId = Number(t.event_id);
        if (!eventTagsMap[eId]) eventTagsMap[eId] = [];
        eventTagsMap[eId].push({
          id: t.id,
          name: t.name,
          colorHex: t.color_hex,
        });
      });

      // Fetch RSVP counts
      const rsvpCounts = await db('rsvps')
        .whereIn('event_id', eventIds)
        .select('event_id', 'status')
        .count('* as count')
        .groupBy('event_id', 'status');

      rsvpCounts.forEach((r: any) => {
        const eId = Number(r.event_id);
        if (!rsvpStatsMap[eId]) {
          rsvpStatsMap[eId] = { yes: 0, maybe: 0, no: 0, total: 0 };
        }
        const count = Number(r.count);
        if (r.status === 'yes') rsvpStatsMap[eId].yes = count;
        if (r.status === 'maybe') rsvpStatsMap[eId].maybe = count;
        if (r.status === 'no') rsvpStatsMap[eId].no = count;
        rsvpStatsMap[eId].total += count;
      });

      // Fetch current user's RSVP status if logged in
      if (currentUserId) {
        const userRsvps = await db('rsvps')
          .whereIn('event_id', eventIds)
          .where('user_id', currentUserId)
          .select('event_id', 'status');

        userRsvps.forEach((r: any) => {
          const eId = Number(r.event_id);
          userRsvpMap[eId] = r.status;
        });
      }
    }

    const formattedEvents = events.map((e) => {
      const parsedTime = typeof e.start_time === 'number' ? e.start_time : (!isNaN(Number(e.start_time)) && String(e.start_time).trim() !== '') ? Number(e.start_time) : e.start_time;
      const isPast = new Date(parsedTime) < new Date();
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        eventType: e.event_type,
        isTruePrivate: Boolean(e.is_true_private),
        startTime: e.start_time,
        endTime: e.end_time,
        capacity: e.capacity,
        bannerUrl: e.banner_url,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
        isPast,
        creator: {
          id: e.creator_id,
          name: e.creator_name,
          email: e.creator_email,
          avatarUrl: e.creator_avatar,
        },
        tags: eventTagsMap[e.id] || [],
        rsvpStats: rsvpStatsMap[e.id] || { yes: 0, maybe: 0, no: 0, total: 0 },
        userRsvp: userRsvpMap[e.id] || null,
        isCreator: currentUserId ? Number(e.creator_id) === Number(currentUserId) : false,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      events: formattedEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getEventById(id: number, currentUserId?: number) {
    const event = await db('events')
      .leftJoin('users', 'events.creator_id', 'users.id')
      .where('events.id', id)
      .select(
        'events.id',
        'events.title',
        'events.description',
        'events.location',
        'events.event_type',
        'events.is_true_private',
        'events.start_time',
        'events.end_time',
        'events.capacity',
        'events.banner_url',
        'events.created_at',
        'events.updated_at',
        'users.id as creator_id',
        'users.name as creator_name',
        'users.email as creator_email',
        'users.avatar_url as creator_avatar'
      )
      .first();

    if (!event) {
      const error: any = new Error('Event not found.');
      error.statusCode = 404;
      error.code = 'EVENT_NOT_FOUND';
      throw error;
    }

    // Logic 2: True Private event is strictly forbidden for unauthenticated visitors
    if (Boolean(event.is_true_private) && !currentUserId) {
      const error: any = new Error('This event is strictly private. Please sign in to view details.');
      error.statusCode = 403;
      error.code = 'PRIVATE_EVENT_FORBIDDEN';
      throw error;
    }

    // Logic 1: Standard Private event allows preview to guests with restricted RSVP and masked attendees
    const isStandardPrivateGuest = event.event_type === 'private' && !currentUserId;

    // Fetch tags
    const tags = await db('event_tags')
      .join('tags', 'event_tags.tag_id', 'tags.id')
      .where('event_tags.event_id', id)
      .select('tags.id', 'tags.name', 'tags.color_hex');

    // Fetch RSVP stats
    const rsvpCounts = await db('rsvps')
      .where('event_id', id)
      .select('status')
      .count('* as count')
      .groupBy('status');

    const rsvpStats = { yes: 0, maybe: 0, no: 0, total: 0 };
    rsvpCounts.forEach((r) => {
      const count = Number(r.count);
      if (r.status === 'yes') rsvpStats.yes = count;
      if (r.status === 'maybe') rsvpStats.maybe = count;
      if (r.status === 'no') rsvpStats.no = count;
      rsvpStats.total += count;
    });

    // Fetch attendees list (users who RSVP'd yes/maybe) - only if not standard private guest
    let attendees: any[] = [];
    if (!isStandardPrivateGuest) {
      attendees = await db('rsvps')
        .join('users', 'rsvps.user_id', 'users.id')
        .where('rsvps.event_id', id)
        .select(
          'users.id',
          'users.name',
          'users.avatar_url',
          'rsvps.status',
          'rsvps.updated_at'
        )
        .orderBy('rsvps.updated_at', 'desc')
        .limit(50);
    }

    // Current user's RSVP status
    let userRsvp = null;
    if (currentUserId) {
      const rsvpRecord = await db('rsvps')
        .where({ event_id: id, user_id: currentUserId })
        .first();
      if (rsvpRecord) {
        userRsvp = rsvpRecord.status;
      }
    }

    const parsedTime = typeof event.start_time === 'number' ? event.start_time : (!isNaN(Number(event.start_time)) && String(event.start_time).trim() !== '') ? Number(event.start_time) : event.start_time;
    const isPast = new Date(parsedTime) < new Date();

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventType: event.event_type,
      isTruePrivate: Boolean(event.is_true_private),
      startTime: event.start_time,
      endTime: event.end_time,
      capacity: event.capacity,
      bannerUrl: event.banner_url,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      isPast,
      isRestricted: isStandardPrivateGuest,
      creator: {
        id: event.creator_id,
        name: event.creator_name,
        email: event.creator_email,
        avatarUrl: event.creator_avatar,
      },
      tags: tags.map((t) => ({ id: t.id, name: t.name, colorHex: t.color_hex })),
      rsvpStats,
      attendees: attendees.map((a) => ({
        id: a.id,
        name: a.name,
        avatarUrl: a.avatar_url,
        status: a.status,
        updatedAt: a.updated_at,
      })),
      userRsvp,
      isCreator: currentUserId ? Number(event.creator_id) === Number(currentUserId) : false,
    };
  }

  static async createEvent(data: CreateEventInput, creatorId: number) {
    const finalTagIds: number[] = [...(data.tag_ids || [])];

    // Handle dynamically added new tag strings
    if (data.new_tags && data.new_tags.length > 0) {
      for (const tagName of data.new_tags) {
        const tag = await TagService.createTag(tagName);
        if (!finalTagIds.includes(tag.id)) {
          finalTagIds.push(tag.id);
        }
      }
    }

    const isTruePrivate = data.event_type === 'private' ? Boolean(data.is_true_private) : false;

    return await db.transaction(async (trx) => {
      const [eventIdRaw] = await trx('events').insert({
        creator_id: creatorId,
        title: data.title.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        event_type: data.event_type,
        is_true_private: isTruePrivate,
        start_time: new Date(data.start_time),
        end_time: data.end_time ? new Date(data.end_time) : null,
        capacity: data.capacity || null,
        banner_url: data.banner_url || null,
      });

      const eventId = typeof eventIdRaw === 'object' ? (eventIdRaw as any).id || 1 : eventIdRaw;

      if (finalTagIds.length > 0) {
        const tagRows = finalTagIds.map((tagId) => ({
          event_id: eventId,
          tag_id: tagId,
        }));
        await trx('event_tags').insert(tagRows);
      }

      // Creator automatically has RSVP 'yes'
      await trx('rsvps').insert({
        event_id: eventId,
        user_id: creatorId,
        status: 'yes',
      });

      return eventId;
    });
  }

  static async updateEvent(id: number, data: Partial<CreateEventInput>, currentUserId: number) {
    const existing = await db('events').where({ id }).first();
    if (!existing) {
      const error: any = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (Number(existing.creator_id) !== Number(currentUserId)) {
      const error: any = new Error('Forbidden: Only the event creator can edit this event.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const updateFields: any = {};
    if (data.title !== undefined) updateFields.title = data.title.trim();
    if (data.description !== undefined) updateFields.description = data.description.trim();
    if (data.location !== undefined) updateFields.location = data.location.trim();
    if (data.event_type !== undefined) {
      updateFields.event_type = data.event_type;
      if (data.event_type === 'public') {
        updateFields.is_true_private = false;
      }
    }
    if (data.is_true_private !== undefined) {
      const targetType = data.event_type || existing.event_type;
      updateFields.is_true_private = targetType === 'private' ? Boolean(data.is_true_private) : false;
    }
    if (data.start_time !== undefined) updateFields.start_time = new Date(data.start_time);
    if (data.end_time !== undefined) updateFields.end_time = data.end_time ? new Date(data.end_time) : null;
    if (data.capacity !== undefined) updateFields.capacity = data.capacity || null;
    if (data.banner_url !== undefined) updateFields.banner_url = data.banner_url || null;
    updateFields.updated_at = new Date();

    await db.transaction(async (trx) => {
      if (Object.keys(updateFields).length > 0) {
        await trx('events').where({ id }).update(updateFields);
      }

      // If tag_ids or new_tags provided, update junction table
      if (data.tag_ids !== undefined || data.new_tags !== undefined) {
        const finalTagIds: number[] = [...(data.tag_ids || [])];

        if (data.new_tags && data.new_tags.length > 0) {
          for (const tagName of data.new_tags) {
            const tag = await TagService.createTag(tagName);
            if (!finalTagIds.includes(tag.id)) {
              finalTagIds.push(tag.id);
            }
          }
        }

        await trx('event_tags').where({ event_id: id }).del();
        if (finalTagIds.length > 0) {
          const tagRows = finalTagIds.map((tagId) => ({
            event_id: id,
            tag_id: tagId,
          }));
          await trx('event_tags').insert(tagRows);
        }
      }
    });

    return await this.getEventById(id, currentUserId);
  }

  static async deleteEvent(id: number, currentUserId: number) {
    const existing = await db('events').where({ id }).first();
    if (!existing) {
      const error: any = new Error('Event not found.');
      error.statusCode = 404;
      throw error;
    }

    if (Number(existing.creator_id) !== Number(currentUserId)) {
      const error: any = new Error('Forbidden: Only the event creator can delete this event.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    await db('events').where({ id }).del();
    return { message: 'Event successfully deleted.' };
  }

  static async getEventMetrics() {
    const now = new Date().toISOString();
    const [totalEvents] = await db('events').count('* as count');
    const [upcomingEvents] = await db('events').where('start_time', '>=', now).count('* as count');
    const [pastEvents] = await db('events').where('start_time', '<', now).count('* as count');
    const [totalRsvps] = await db('rsvps').where('status', 'yes').count('* as count');
    const [totalTags] = await db('tags').count('* as count');

    return {
      totalEvents: Number(totalEvents?.count || 0),
      upcomingEvents: Number(upcomingEvents?.count || 0),
      pastEvents: Number(pastEvents?.count || 0),
      totalRsvps: Number(totalRsvps?.count || 0),
      totalTags: Number(totalTags?.count || 0),
    };
  }
}
