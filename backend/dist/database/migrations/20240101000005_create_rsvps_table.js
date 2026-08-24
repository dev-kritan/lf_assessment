"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('rsvps', (table) => {
        table.increments('id').primary();
        table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.enum('status', ['yes', 'no', 'maybe']).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
        table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
        table.unique(['event_id', 'user_id']);
        table.index(['event_id']);
        table.index(['user_id']);
        table.index(['status']);
    });
}
async function down(knex) {
    return knex.schema.dropTableIfExists('rsvps');
}
