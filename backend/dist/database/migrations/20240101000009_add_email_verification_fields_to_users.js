"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    const hasExpiresAt = await knex.schema.hasColumn('users', 'verification_token_expires_at');
    if (hasExpiresAt) {
        await knex.schema.alterTable('users', (table) => {
            table.dropColumn('verification_token_expires_at');
        });
    }
}
