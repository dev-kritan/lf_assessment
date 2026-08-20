import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tags', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('color_hex', 20).defaultTo('#6366f1').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tags');
}
