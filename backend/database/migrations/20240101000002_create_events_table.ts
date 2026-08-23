import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.integer('creator_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').notNullable();
    table.string('location', 255).notNullable();
    table.enum('event_type', ['public', 'private']).defaultTo('public').notNullable();
    table.boolean('is_true_private').defaultTo(false).notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time').nullable();
    table.integer('capacity').nullable();
    table.string('banner_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['creator_id']);
    table.index(['event_type']);
    table.index(['is_true_private']);
    table.index(['start_time']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('events');
}
