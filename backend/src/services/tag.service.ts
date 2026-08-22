import db from '../config/knex';

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
