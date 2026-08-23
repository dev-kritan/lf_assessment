import db from '../config/knex';

export interface TagFilterParams {
  event_type?: 'all' | 'public' | 'private';
  timeframe?: 'all' | 'upcoming' | 'past';
  search?: string;
}

export class TagService {
  /**
   * Generates a random 24-bit RGB hex color (#000000 to #ffffff).
   */
  static generateRandomHexColor(): string {
    const randomInt = Math.floor(Math.random() * 16777216);
    return `#${randomInt.toString(16).padStart(6, '0')}`;
  }

  /**
   * Generates a randomized hex color that is not currently used by any existing tag.
   */
  static async getUniqueRandomColor(): Promise<string> {
    const existingTags = await db('tags').select('color_hex');
    const usedColors = new Set(existingTags.map((t) => (t.color_hex || '').toLowerCase()));

    let color = this.generateRandomHexColor();
    let attempts = 0;
    while (usedColors.has(color.toLowerCase()) && attempts < 100) {
      color = this.generateRandomHexColor();
      attempts++;
    }
    return color;
  }

  static async getAllTags(params: TagFilterParams = {}, currentUserId?: number) {
    const eventsSubquery = db('event_tags')
      .join('events', 'event_tags.event_id', 'events.id')
      .select('event_tags.tag_id', 'events.id as event_id');

    // If not authenticated, true private events are excluded from tag counts
    if (!currentUserId) {
      eventsSubquery.where((builder) => {
        builder
          .where('events.is_true_private', false)
          .orWhereNull('events.is_true_private');
      });
    }

    // Filter by Event Type (if explicitly specified)
    if (params.event_type && params.event_type !== 'all') {
      eventsSubquery.where('events.event_type', params.event_type);
    }

    // Filter by Timeframe
    if (params.timeframe === 'upcoming') {
      eventsSubquery.where('events.start_time', '>=', new Date());
    } else if (params.timeframe === 'past') {
      eventsSubquery.where('events.start_time', '<', new Date());
    }

    // Filter by Search Keyword
    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      eventsSubquery.where((builder) => {
        builder
          .where('events.title', 'like', term)
          .orWhere('events.description', 'like', term)
          .orWhere('events.location', 'like', term);
      });
    }

    const tags = await db('tags')
      .leftJoin(eventsSubquery.as('filtered_events'), 'tags.id', 'filtered_events.tag_id')
      .select('tags.id', 'tags.name', 'tags.color_hex')
      .count('filtered_events.event_id as event_count')
      .groupBy('tags.id', 'tags.name', 'tags.color_hex')
      .orderBy('tags.name', 'asc');

    return tags.map((t) => ({
      id: Number(t.id),
      name: t.name,
      colorHex: t.color_hex,
      eventCount: Number(t.event_count || 0),
    }));
  }

  static async createTag(name: string, colorHex?: string) {
    const trimmedName = name.trim();
    const existing = await db('tags').whereRaw('LOWER(name) = ?', [trimmedName.toLowerCase()]).first();
    if (existing) {
      return {
        id: Number(existing.id),
        name: existing.name,
        colorHex: existing.color_hex,
      };
    }

    const assignedColor = colorHex && colorHex !== '#6366f1'
      ? colorHex
      : await TagService.getUniqueRandomColor();

    const [insertedIdRaw] = await db('tags').insert({
      name: trimmedName,
      color_hex: assignedColor,
    });

    const id = typeof insertedIdRaw === 'object' ? (insertedIdRaw as any).id || 1 : insertedIdRaw;
    const newTag = await db('tags').where({ id }).first();

    return {
      id: Number(newTag.id),
      name: newTag.name,
      colorHex: newTag.color_hex,
    };
  }

  static async getTagUsage(tagId: number, currentUserId?: number) {
    const tag = await db('tags').where({ id: tagId }).first();
    if (!tag) {
      const error = new Error('Tag not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const query = db('event_tags')
      .join('events', 'event_tags.event_id', 'events.id')
      .where('event_tags.tag_id', tagId)
      .select(
        'events.id',
        'events.title',
        'events.event_type',
        'events.is_true_private',
        'events.start_time',
        'events.location'
      )
      .orderBy('events.start_time', 'asc');

    if (!currentUserId) {
      query.where((builder) => {
        builder
          .where('events.is_true_private', false)
          .orWhereNull('events.is_true_private');
      });
    }

    const associatedEvents = await query;
    const countResult = await db('event_tags').where({ tag_id: tagId }).count('id as count').first();
    const eventCount = Number(countResult?.count || 0);

    return {
      tag: {
        id: Number(tag.id),
        name: tag.name,
        colorHex: tag.color_hex,
      },
      eventCount,
      associatedEvents: associatedEvents.map((e) => ({
        id: Number(e.id),
        title: e.title,
        eventType: e.event_type,
        startTime: e.start_time,
        location: e.location,
        isTruePrivate: Boolean(e.is_true_private),
      })),
    };
  }

  static async updateTag(tagId: number, data: { name?: string; colorHex?: string }) {
    const tag = await db('tags').where({ id: tagId }).first();
    if (!tag) {
      const error = new Error('Tag not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const updates: Record<string, any> = {};

    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
        const error = new Error('Tag name must be between 2 and 50 characters');
        (error as any).statusCode = 400;
        throw error;
      }

      // Check case-insensitive duplicate excluding current tag
      const duplicate = await db('tags')
        .whereRaw('LOWER(name) = ? AND id != ?', [trimmedName.toLowerCase(), tagId])
        .first();

      if (duplicate) {
        const error = new Error(`Tag with name "${trimmedName}" already exists`);
        (error as any).statusCode = 409;
        throw error;
      }

      updates.name = trimmedName;
    }

    if (data.colorHex !== undefined) {
      const trimmedColor = data.colorHex.trim();
      const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
      if (!hexRegex.test(trimmedColor)) {
        const error = new Error('Invalid color hex code. Must be a valid hex color (e.g. #6366f1)');
        (error as any).statusCode = 400;
        throw error;
      }
      updates.color_hex = trimmedColor;
    }

    if (Object.keys(updates).length > 0) {
      await db('tags').where({ id: tagId }).update(updates);
    }

    const updated = await db('tags').where({ id: tagId }).first();
    const countResult = await db('event_tags').where({ tag_id: tagId }).count('id as count').first();

    return {
      id: Number(updated.id),
      name: updated.name,
      colorHex: updated.color_hex,
      affectedEventsCount: Number(countResult?.count || 0),
    };
  }

  static async deleteTag(tagId: number) {
    const tag = await db('tags').where({ id: tagId }).first();
    if (!tag) {
      const error = new Error('Tag not found');
      (error as any).statusCode = 404;
      throw error;
    }

    const countResult = await db('event_tags').where({ tag_id: tagId }).count('id as count').first();
    const affectedEventsCount = Number(countResult?.count || 0);

    // Cascades on event_tags automatically
    await db('tags').where({ id: tagId }).delete();

    return {
      deletedTag: {
        id: Number(tag.id),
        name: tag.name,
        colorHex: tag.color_hex,
      },
      affectedEventsCount,
    };
  }
}

