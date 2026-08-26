import db from "../config/knex";
import { DB_TABLES } from "../constants";

export class BonusService {
  static async getRawTables() {
    const designations = await db(DB_TABLES.EMP_DESIGNATION_LOG).orderBy(
      "txn_id",
      "asc",
    );
    const allocations = await db(DB_TABLES.EMP_ALLOCATION_LOG).orderBy(
      "allocation_id",
      "asc",
    );
    return {
      empDesignationLog: designations,
      empAllocationLog: allocations,
    };
  }

  static async runQ1() {
    // Q1: Current designation of every employee based on most recent effective_date
    const query = `
      WITH RankedDesignations AS (
        SELECT
          emp_id,
          emp_name,
          designation AS current_designation,
          ROW_NUMBER() OVER (
            PARTITION BY emp_id 
            ORDER BY effective_date DESC, txn_id DESC
          ) AS rn
        FROM emp_designation_log
      )
      SELECT
        emp_id,
        emp_name,
        current_designation
      FROM RankedDesignations
      WHERE rn = 1
      ORDER BY emp_id ASC;
    `;

    const result = await db.raw(query);
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : result.rows || result;

    return {
      question: "Q1: Current Designation of Every Employee",
      sql: query.trim(),
      rows,
      count: rows.length,
    };
  }

  static async runQ2() {
    // Q2: Designation timeline with previous, current, next designation
    const query = `
      SELECT
        emp_id,
        effective_date,
        LAG(designation) OVER (
          PARTITION BY emp_id 
          ORDER BY effective_date ASC, txn_id ASC
        ) AS previous_designation,
        designation,
        LEAD(designation) OVER (
          PARTITION BY emp_id 
          ORDER BY effective_date ASC, txn_id ASC
        ) AS next_designation
      FROM emp_designation_log
      ORDER BY emp_id ASC, effective_date ASC, txn_id ASC;
    `;

    const result = await db.raw(query);
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : result.rows || result;

    return {
      question: "Q2: Designation Timeline (Previous, Current, Next)",
      sql: query.trim(),
      rows,
      count: rows.length,
    };
  }

  static async runQ4() {
    // Q4: Designation held at project allocation_start
    const query = `
      WITH ActiveDesignationPerAllocation AS (
        SELECT
          a.allocation_id,
          a.emp_id,
          d.emp_name,
          a.project_name,
          a.allocated_role,
          a.allocation_start,
          d.designation AS designation_at_allocation,
          ROW_NUMBER() OVER (
            PARTITION BY a.allocation_id 
            ORDER BY d.effective_date DESC, d.txn_id DESC
          ) AS rn
        FROM emp_allocation_log a
        LEFT JOIN emp_designation_log d
          ON a.emp_id = d.emp_id
          AND d.effective_date <= a.allocation_start
      )
      SELECT
        allocation_id,
        emp_id,
        COALESCE(
          emp_name, 
          (SELECT emp_name FROM emp_designation_log d2 WHERE d2.emp_id = ActiveDesignationPerAllocation.emp_id LIMIT 1)
        ) AS emp_name,
        project_name,
        allocated_role,
        allocation_start,
        designation_at_allocation
      FROM ActiveDesignationPerAllocation
      WHERE rn = 1 OR designation_at_allocation IS NULL
      ORDER BY allocation_id ASC;
    `;

    const result = await db.raw(query);
    const rows =
      Array.isArray(result) && Array.isArray(result[0])
        ? result[0]
        : result.rows || result;

    return {
      question: "Q4: Active Designation at Allocation Start",
      sql: query.trim(),
      rows,
      count: rows.length,
    };
  }
}
