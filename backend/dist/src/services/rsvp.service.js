"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RsvpService = void 0;
const knex_1 = __importDefault(require("../config/knex"));
class RsvpService {
    static async setRsvp(eventId, userId, status) {
        const event = await (0, knex_1.default)('events').where({ id: eventId }).first();
        if (!event) {
            const error = new Error('Event not found.');
            error.statusCode = 404;
            throw error;
        }
        // If capacity is reached and user is trying to RSVP 'yes' (and was not already 'yes')
        if (event.capacity && status === 'yes') {
            const existingRsvp = await (0, knex_1.default)('rsvps').where({ event_id: eventId, user_id: userId }).first();
            if (!existingRsvp || existingRsvp.status !== 'yes') {
                const [yesCountResult] = await (0, knex_1.default)('rsvps')
                    .where({ event_id: eventId, status: 'yes' })
                    .count('* as count');
                const yesCount = Number(yesCountResult?.count || 0);
                if (yesCount >= event.capacity) {
                    const error = new Error('Event capacity has been reached. You can still RSVP as "maybe".');
                    error.statusCode = 400;
                    error.code = 'CAPACITY_REACHED';
                    throw error;
                }
            }
        }
        const existing = await (0, knex_1.default)('rsvps').where({ event_id: eventId, user_id: userId }).first();
        if (existing) {
            if (existing.status !== status) {
                await (0, knex_1.default)('rsvps')
                    .where({ event_id: eventId, user_id: userId })
                    .update({
                    status,
                    updated_at: new Date(),
                });
            }
        }
        else {
            await (0, knex_1.default)('rsvps').insert({
                event_id: eventId,
                user_id: userId,
                status,
            });
        }
        // Return updated RSVP counts
        const rsvpCounts = await (0, knex_1.default)('rsvps')
            .where('event_id', eventId)
            .select('status')
            .count('* as count')
            .groupBy('status');
        const rsvpStats = { yes: 0, maybe: 0, no: 0, total: 0 };
        rsvpCounts.forEach((r) => {
            const count = Number(r.count);
            if (r.status === 'yes')
                rsvpStats.yes = count;
            if (r.status === 'maybe')
                rsvpStats.maybe = count;
            if (r.status === 'no')
                rsvpStats.no = count;
            rsvpStats.total += count;
        });
        return {
            status,
            rsvpStats,
            message: `Your RSVP has been set to "${status.toUpperCase()}".`,
        };
    }
    static async getAttendees(eventId) {
        const attendees = await (0, knex_1.default)('rsvps')
            .join('users', 'rsvps.user_id', 'users.id')
            .where('rsvps.event_id', eventId)
            .select('users.id', 'users.name', 'users.avatar_url', 'rsvps.status', 'rsvps.updated_at')
            .orderBy('rsvps.updated_at', 'desc');
        return attendees.map((a) => ({
            id: a.id,
            name: a.name,
            avatarUrl: a.avatar_url,
            status: a.status,
            updatedAt: a.updated_at,
        }));
    }
    static async getUserRsvps(userId) {
        const rsvps = await (0, knex_1.default)('rsvps')
            .join('events', 'rsvps.event_id', 'events.id')
            .leftJoin('users as creator', 'events.creator_id', 'creator.id')
            .where('rsvps.user_id', userId)
            .select('rsvps.status as user_rsvp_status', 'rsvps.updated_at as rsvp_date', 'events.*', 'creator.name as creator_name', 'creator.avatar_url as creator_avatar')
            .orderBy('events.start_time', 'asc');
        return rsvps;
    }
}
exports.RsvpService = RsvpService;
