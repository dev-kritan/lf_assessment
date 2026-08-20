import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('emp_designation_log', (table) => {
    table.string('txn_id', 10).primary();
    table.string('emp_id', 10).notNullable();
    table.string('emp_name', 100).notNullable();
    table.string('designation', 100).notNullable();
    table.date('effective_date').notNullable();

    table.index(['emp_id', 'effective_date']);
  });

  await knex.schema.createTable('emp_allocation_log', (table) => {
    table.string('allocation_id', 10).primary();
    table.string('emp_id', 10).notNullable();
    table.string('project_name', 100).notNullable();
    table.string('allocated_role', 100).notNullable();
    table.date('allocation_start').notNullable();
    table.date('allocation_end').nullable();

    table.index(['emp_id', 'allocation_start']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('emp_allocation_log');
  await knex.schema.dropTableIfExists('emp_designation_log');
}
