import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('event_tags', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE');
    table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
    table.unique(['event_id', 'tag_id']);
    table.index(['event_id']);
    table.index(['tag_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('event_tags');
}
