"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    return knex.schema.createTable('tags', (table) => {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('color_hex', 20).defaultTo('#6366f1').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    });
}
async function down(knex) {
    return knex.schema.dropTableIfExists('tags');
}
