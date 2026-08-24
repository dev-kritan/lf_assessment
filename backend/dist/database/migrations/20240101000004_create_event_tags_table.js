"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('event_tags', (table) => {
        table.increments('id').primary();
        table.integer('event_id').unsigned().notNullable().references('id').inTable('events').onDelete('CASCADE');
        table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
        table.unique(['event_id', 'tag_id']);
        table.index(['event_id']);
        table.index(['tag_id']);
    });
}
async function down(knex) {
    return knex.schema.dropTableIfExists('event_tags');
}
