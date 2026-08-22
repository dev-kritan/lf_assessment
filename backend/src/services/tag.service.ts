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

    // If not authenticated, only public events are counted
    if (!currentUserId) {
      eventsSubquery.where('events.event_type', 'public');
    }

    // Filter by Event Type
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
}
