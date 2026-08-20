import db from '../config/knex';

export class TagService {
  static async getAllTags() {
    const tags = await db('tags')
      .leftJoin('event_tags', 'tags.id', 'event_tags.tag_id')
      .select('tags.id', 'tags.name', 'tags.color_hex')
      .count('event_tags.event_id as event_count')
      .groupBy('tags.id', 'tags.name', 'tags.color_hex')
      .orderBy('tags.name', 'asc');

    return tags.map((t) => ({
      id: Number(t.id),
      name: t.name,
      colorHex: t.color_hex,
      eventCount: Number(t.event_count || 0),
    }));
  }

  static async createTag(name: string, colorHex: string = '#6366f1') {
    const trimmedName = name.trim();
    const existing = await db('tags').whereRaw('LOWER(name) = ?', [trimmedName.toLowerCase()]).first();
    if (existing) {
      return {
        id: Number(existing.id),
        name: existing.name,
        colorHex: existing.color_hex,
      };
    }

    const [insertedIdRaw] = await db('tags').insert({
      name: trimmedName,
      color_hex: colorHex,
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
