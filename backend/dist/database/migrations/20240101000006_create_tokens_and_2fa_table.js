"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    return knex.schema.dropTableIfExists('refresh_tokens');
}
