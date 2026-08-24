"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasColumn = await knex.schema.hasColumn('events', 'is_true_private');
    if (!hasColumn) {
        await knex.schema.alterTable('events', (table) => {
            table.boolean('is_true_private').defaultTo(false).notNullable();
            table.index(['is_true_private']);
        });
    }
}
async function down(knex) {
    const hasColumn = await knex.schema.hasColumn('events', 'is_true_private');
    if (hasColumn) {
        await knex.schema.alterTable('events', (table) => {
            table.dropColumn('is_true_private');
        });
    }
}
