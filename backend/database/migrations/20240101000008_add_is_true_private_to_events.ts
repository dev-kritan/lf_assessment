import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('events', 'is_true_private');
  if (!hasColumn) {
    await knex.schema.alterTable('events', (table) => {
      table.boolean('is_true_private').defaultTo(false).notNullable();
      table.index(['is_true_private']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('events', 'is_true_private');
  if (hasColumn) {
    await knex.schema.alterTable('events', (table) => {
      table.dropColumn('is_true_private');
    });
  }
}
