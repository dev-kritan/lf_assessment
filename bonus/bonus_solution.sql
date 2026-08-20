-- =====================================================================
-- ASSESSMENT BONUS SECTION: SQL SOLUTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SCHEMA DEFINITION
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS emp_allocation_log;
DROP TABLE IF EXISTS emp_designation_log;

CREATE TABLE emp_designation_log (
    txn_id VARCHAR(10) PRIMARY KEY,
    emp_id VARCHAR(10) NOT NULL,
    emp_name VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL
);

CREATE TABLE emp_allocation_log (
    allocation_id VARCHAR(10) PRIMARY KEY,
    emp_id VARCHAR(10) NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    allocated_role VARCHAR(100) NOT NULL,
    allocation_start DATE NOT NULL,
    allocation_end DATE NULL
);

-- Indexes to optimize queries
CREATE INDEX idx_emp_desig_emp_date ON emp_designation_log(emp_id, effective_date, txn_id);
CREATE INDEX idx_emp_alloc_emp_start ON emp_allocation_log(emp_id, allocation_start);

-- ---------------------------------------------------------------------
-- 2. SAMPLE DATA INSERTION (From PDF Pages 4-6)
-- ---------------------------------------------------------------------

INSERT INTO emp_designation_log (txn_id, emp_id, emp_name, designation, effective_date) VALUES
('T001', 'EMP001', 'Alice Johnson', 'Associate Developer', '2024-02-01'),
('T002', 'EMP001', 'Alice Johnson', 'Mid Developer', '2024-02-05'),
('T003', 'EMP001', 'Alice Johnson', 'Senior Developer', '2024-02-10'),
('T004', 'EMP002', 'Bob Martinez', 'Mid Developer', '2024-05-02'),
('T005', 'EMP002', 'Bob Martinez', 'Senior Developer', '2024-07-15'),
('T006', 'EMP002', 'Bob Martinez', 'Mid Developer', '2024-09-20'),
('T007', 'EMP003', 'Carol Smith', 'Mid Developer', '2024-08-06'),
('T008', 'EMP003', 'Carol Smith', 'Mid Developer', '2024-08-06'),
('T009', 'EMP004', 'David Lee', 'Associate Developer', '2024-01-10'),
('T010', 'EMP004', 'David Lee', 'Associate Developer', '2024-04-10'),
('T011', 'EMP004', 'David Lee', 'Mid Developer', '2024-09-10'),
('T012', 'EMP005', 'Eva Chen', 'Senior Developer', '2024-06-15'),
('T013', 'EMP005', 'Eva Chen', 'Mid Developer', '2024-03-01'),
('T014', 'EMP005', 'Eva Chen', 'Senior Developer', '2024-11-20'),
('T015', 'EMP006', 'Frank Patel', 'Associate Developer', '2024-01-01'),
('T016', 'EMP006', 'Frank Patel', 'Mid Developer', '2024-05-10'),
('T017', 'EMP006', 'Frank Patel', 'Mid Developer', '2024-05-10'),
('T018', 'EMP007', 'Grace Kim', 'Senior Developer', '2023-03-03'),
('T019', 'EMP007', 'Grace Kim', 'Resigned', '2023-06-30'),
('T020', 'EMP007', 'Grace Kim', 'Associate Developer', '2024-01-15'),
('T021', 'EMP007', 'Grace Kim', 'Mid Developer', '2024-07-15'),
('T022', 'EMP008', 'Henry Walsh', 'Associate Developer', '2024-06-01'),
('T023', 'EMP008', 'Henry Walsh', 'Mid Developer', '2024-06-01'),
('T024', 'EMP009', 'Irene Novak', 'Senior Developer', '2024-09-01');

INSERT INTO emp_allocation_log (allocation_id, emp_id, project_name, allocated_role, allocation_start, allocation_end) VALUES
('A001', 'EMP001', 'Project Alpha', 'Developer', '2024-02-03', '2024-04-30'),
('A002', 'EMP001', 'Project Beta', 'Tech Lead', '2024-05-01', '2024-09-30'),
('A003', 'EMP002', 'Project Alpha', 'Developer', '2024-05-10', '2024-08-31'),
('A004', 'EMP002', 'Project Gamma', 'Senior Contributor', '2024-09-01', NULL),
('A005', 'EMP003', 'Project Beta', 'Developer', '2024-08-06', '2024-12-31'),
('A006', 'EMP004', 'Project Delta', 'Developer', '2024-02-01', '2024-10-31'),
('A007', 'EMP005', 'Project Alpha', 'Senior Contributor', '2024-04-01', '2024-07-31'),
('A008', 'EMP005', 'Project Gamma', 'Tech Lead', '2024-08-01', NULL),
('A009', 'EMP006', 'Project Delta', 'Developer', '2024-03-01', '2024-06-30'),
('A010', 'EMP007', 'Project Beta', 'Developer', '2024-02-01', '2024-06-30'),
('A011', 'EMP008', 'Project Alpha', 'Developer', '2024-07-01', NULL),
('A012', 'EMP009', 'Project Gamma', 'Senior Contributor', '2024-10-01', NULL);


-- =====================================================================
-- QUESTION 1 (Q1)
-- =====================================================================
-- Objective: Return the current designation of every employee — defined as
-- the designation from their most recent effective_date.
-- Output columns: emp_id | emp_name | current_designation

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


-- =====================================================================
-- QUESTION 2 (Q2)
-- =====================================================================
-- Objective: A side-by-side view showing previous, current, and next designation for every row.
-- Output columns: emp_id | effective_date | previous_designation | designation | next_designation

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


-- =====================================================================
-- QUESTION 4 (Q4 - 8 marks)
-- =====================================================================
-- Objective: For each project allocation, find what designation the employee held
-- at the time they were allocated to that project (on allocation_start).
-- Output columns:
-- allocation_id | emp_id | emp_name | project_name | allocated_role | allocation_start | designation_at_allocation

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
