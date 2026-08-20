import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index(['user_id']);
    table.index(['token_hash']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('refresh_tokens');
}
