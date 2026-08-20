# Bonus Section: SQL Queries & Logic Analysis

This document provides complete solutions, algorithmic explanations, edge-case handling, and execution analysis for the database questions presented in the assessment.

---

## Data Schema Summary

### Table 1: `emp_designation_log`
Tracks designation history over time. Each row represents a change in employee designation.
- `txn_id` (VARCHAR): Unique transaction identifier.
- `emp_id` (VARCHAR): Unique employee identifier.
- `emp_name` (VARCHAR): Employee's full name.
- `designation` (VARCHAR): Designation assigned at this point in time.
- `effective_date` (DATE): Date this designation became effective.

### Table 2: `emp_allocation_log`
Tracks project assignments over time.
- `allocation_id` (VARCHAR): Unique project allocation identifier.
- `emp_id` (VARCHAR): Unique employee identifier.
- `project_name` (VARCHAR): Name of the project.
- `allocated_role` (VARCHAR): Role played by the employee in the project.
- `allocation_start` (DATE): Date the project allocation began.
- `allocation_end` (DATE): Date the allocation ended (`NULL` if active).

---

## Question 1 (Q1)

### Requirement
> Return the current designation of every employee — defined as the designation from their most recent `effective_date`.
> 
> **Output Format:**
> `emp_id | emp_name | current_designation`

### Solution Strategy
1. Group records by `emp_id`.
2. Rank each record in descending order of `effective_date`.
3. In case of identical `effective_date` values for an employee, break ties using `txn_id DESC` (the latest transaction).
4. Filter for `rn = 1`.

### SQL Query
```sql
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
```

### Result on Sample Data
| emp_id | emp_name | current_designation |
| :--- | :--- | :--- |
| EMP001 | Alice Johnson | Senior Developer |
| EMP002 | Bob Martinez | Mid Developer |
| EMP003 | Carol Smith | Mid Developer |
| EMP004 | David Lee | Mid Developer |
| EMP005 | Eva Chen | Senior Developer |
| EMP006 | Frank Patel | Mid Developer |
| EMP007 | Grace Kim | Mid Developer |
| EMP008 | Henry Walsh | Mid Developer |
| EMP009 | Irene Novak | Senior Developer |

---

## Question 2 (Q2)

### Requirement
> Return a side-by-side view of where each employee came from and where they are going for every row in `emp_designation_log`.
> 
> **Output Format:**
> `emp_id | effective_date | previous_designation | designation | next_designation`
> 
> *Where `previous_designation` is the designation held just before this row (for the same employee), and `next_designation` is the one that comes after. Return `NULL` where there is no previous or next.*

### Solution Strategy
1. Use the SQL standard `LAG()` and `LEAD()` analytic window functions.
2. Partition the window by `emp_id` and order by `effective_date ASC, txn_id ASC`.
3. `LAG(designation)` fetches the immediately preceding designation for that employee.
4. `LEAD(designation)` fetches the immediately following designation for that employee.

### SQL Query
```sql
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
```

---

## Question 4 (Q4 - 8 Marks)

### Requirement
> "For each project allocation, we want to know what designation the employee held at the time they were allocated to that project (`allocation_start`)."
> 
> **Output Format:**
> `allocation_id | emp_id | emp_name | project_name | allocated_role | allocation_start | designation_at_allocation`

### Key Challenges & Edge Cases Handled
1. **Asynchronous Date Matching**: There is no direct foreign key for designation on the allocation table. The designation active at `allocation_start` is the record in `emp_designation_log` with the maximum `effective_date` that is $\le$ `allocation_start`.
2. **Multiple Designation Changes on the Same Day**: If multiple transactions occur on the same `effective_date`, `txn_id DESC` resolves to the most recent transaction.
3. **No Prior Designation**: If an employee was allocated before any designation record existed, a `LEFT JOIN` preserves the allocation row and yields `NULL` for `designation_at_allocation`.
4. **Missing Employee Name in Allocation Table**: The query uses `COALESCE` with a subquery lookup to ensure `emp_name` is always populated even if no prior designation matches the `LEFT JOIN` date condition.

### SQL Query
```sql
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
```

### Result on Sample Data
| allocation_id | emp_id | emp_name | project_name | allocated_role | allocation_start | designation_at_allocation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| A001 | EMP001 | Alice Johnson | Project Alpha | Developer | 2024-02-03 | Associate Developer |
| A002 | EMP001 | Alice Johnson | Project Beta | Tech Lead | 2024-05-01 | Senior Developer |
| A003 | EMP002 | Bob Martinez | Project Alpha | Developer | 2024-05-10 | Mid Developer |
| A004 | EMP002 | Bob Martinez | Project Gamma | Senior Contributor | 2024-09-01 | Senior Developer |
| A005 | EMP003 | Carol Smith | Project Beta | Developer | 2024-08-06 | Mid Developer |
| A006 | EMP004 | David Lee | Project Delta | Developer | 2024-02-01 | Associate Developer |
| A007 | EMP005 | Eva Chen | Project Alpha | Senior Contributor | 2024-04-01 | Mid Developer |
| A008 | EMP005 | Eva Chen | Project Gamma | Tech Lead | 2024-08-01 | Senior Developer |
| A009 | EMP006 | Frank Patel | Project Delta | Developer | 2024-03-01 | Associate Developer |
| A010 | EMP007 | Grace Kim | Project Beta | Developer | 2024-02-01 | Associate Developer |
| A011 | EMP008 | Henry Walsh | Project Alpha | Developer | 2024-07-01 | Mid Developer |
| A012 | EMP009 | Irene Novak | Project Gamma | Senior Contributor | 2024-10-01 | Senior Developer |

---

## Indexing & Performance Recommendations

For high-volume production databases:
1. `CREATE INDEX idx_emp_desig ON emp_designation_log (emp_id, effective_date DESC, txn_id DESC);`
   - Covers the `PARTITION BY emp_id ORDER BY effective_date DESC` operation with zero temporary tables or filesorts.
2. `CREATE INDEX idx_emp_alloc ON emp_allocation_log (emp_id, allocation_start);`
   - Accelerates join lookup from allocations into the designation timeline.
