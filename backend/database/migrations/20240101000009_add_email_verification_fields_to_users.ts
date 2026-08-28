import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasExpiresAt = await knex.schema.hasColumn('users', 'verification_token_expires_at');
  if (!hasExpiresAt) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('verification_token_expires_at').nullable();
    });
  }

  const hasToken = await knex.schema.hasColumn('users', 'email_verification_token');
  if (!hasToken) {
    await knex.schema.alterTable('users', (table) => {
      table.string('email_verification_token', 255).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasExpiresAt = await knex.schema.hasColumn('users', 'verification_token_expires_at');
  if (hasExpiresAt) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('verification_token_expires_at');
    });
  }
}
