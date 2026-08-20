import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.boolean('is_email_verified').defaultTo(false).notNullable();
    table.string('email_verification_token', 255).nullable();
    table.boolean('two_factor_enabled').defaultTo(false).notNullable();
    table.string('two_factor_secret', 255).nullable();
    table.string('avatar_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('users');
}
