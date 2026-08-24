import db from '../config/knex';
import { DB_TABLES, ERROR_CODES } from '../constants';

export type RsvpStatus = 'yes' | 'no' | 'maybe';

export class RsvpService {
  static async setRsvp(eventId: number, userId: number, status: RsvpStatus) {
    const event = await db(DB_TABLES.EVENTS).where({ id: eventId }).first();
    if (!event) {
      const error: any = new Error('Event not found.');
      error.statusCode = 404;
      error.code = ERROR_CODES.EVENT_NOT_FOUND;
      throw error;
    }

    // If capacity is reached and user is trying to RSVP 'yes' (and was not already 'yes')
    if (event.capacity && status === 'yes') {
      const existingRsvp = await db(DB_TABLES.RSVPS).where({ event_id: eventId, user_id: userId }).first();
      if (!existingRsvp || existingRsvp.status !== 'yes') {
        const [yesCountResult] = await db(DB_TABLES.RSVPS)
          .where({ event_id: eventId, status: 'yes' })
          .count('* as count');
        const yesCount = Number(yesCountResult?.count || 0);

        if (yesCount >= event.capacity) {
          const error: any = new Error('Event capacity has been reached. You can still RSVP as "maybe".');
          error.statusCode = 400;
          error.code = ERROR_CODES.CAPACITY_REACHED;
          throw error;
        }
      }
    }

    const existing = await db(DB_TABLES.RSVPS).where({ event_id: eventId, user_id: userId }).first();

    if (existing) {
      if (existing.status !== status) {
        await db(DB_TABLES.RSVPS)
          .where({ event_id: eventId, user_id: userId })
          .update({
            status,
            updated_at: new Date(),
          });
      }
    } else {
      await db(DB_TABLES.RSVPS).insert({
        event_id: eventId,
        user_id: userId,
        status,
      });
    }

    // Return updated RSVP counts
    const rsvpCounts = await db(DB_TABLES.RSVPS)
      .where('event_id', eventId)
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

    return {
      status,
      rsvpStats,
      message: `Your RSVP has been set to "${status.toUpperCase()}".`,
    };
  }

  static async getAttendees(eventId: number) {
    const attendees = await db(DB_TABLES.RSVPS)
      .join(DB_TABLES.USERS, 'rsvps.user_id', 'users.id')
      .where('rsvps.event_id', eventId)
      .select(
        'users.id',
        'users.name',
        'users.avatar_url',
        'rsvps.status',
        'rsvps.updated_at'
      )
      .orderBy('rsvps.updated_at', 'desc');

    return attendees.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatar_url,
      status: a.status,
      updatedAt: a.updated_at,
    }));
  }

  static async getUserRsvps(userId: number) {
    const rsvps = await db(DB_TABLES.RSVPS)
      .join(DB_TABLES.EVENTS, 'rsvps.event_id', 'events.id')
      .leftJoin(`${DB_TABLES.USERS} as creator`, 'events.creator_id', 'creator.id')
      .where('rsvps.user_id', userId)
      .select(
        'rsvps.status as user_rsvp_status',
        'rsvps.updated_at as rsvp_date',
        'events.*',
        'creator.name as creator_name',
        'creator.avatar_url as creator_avatar'
      )
      .orderBy('events.start_time', 'asc');

    return rsvps;
  }
}
