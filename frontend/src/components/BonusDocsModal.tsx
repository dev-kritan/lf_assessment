import React, { useState } from 'react';
import { X, Copy, Check, Download, BookOpen, Database, Sparkles, Layers } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface BonusDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DOCS_MARKDOWN_CONTENT = `# Bonus Section: SQL Queries & Logic Analysis

This document provides complete solutions, algorithmic explanations, edge-case handling, and execution analysis for the database questions presented in the assessment.

---

## Data Schema Summary

### Table 1: \`emp_designation_log\`
Tracks designation history over time. Each row represents a change in employee designation.
- \`txn_id\` (VARCHAR): Unique transaction identifier.
- \`emp_id\` (VARCHAR): Unique employee identifier.
- \`emp_name\` (VARCHAR): Employee's full name.
- \`designation\` (VARCHAR): Designation assigned at this point in time.
- \`effective_date\` (DATE): Date this designation became effective.

### Table 2: \`emp_allocation_log\`
Tracks project assignments over time.
- \`allocation_id\` (VARCHAR): Unique project allocation identifier.
- \`emp_id\` (VARCHAR): Unique employee identifier.
- \`project_name\` (VARCHAR): Name of the project.
- \`allocated_role\` (VARCHAR): Role played by the employee in the project.
- \`allocation_start\` (DATE): Date the project allocation began.
- \`allocation_end\` (DATE): Date the allocation ended (\`NULL\` if active).

---

## Question 1 (Q1)
### Requirement
> Return the current designation of every employee — defined as the designation from their most recent \`effective_date\`.
>
> **Output Format:**
> \`emp_id | emp_name | current_designation\`

### Solution Strategy
1. Group records by \`emp_id\`.
2. Rank each record in descending order of \`effective_date\`.
3. In case of identical \`effective_date\` values for an employee, break ties using \`txn_id DESC\` (the latest transaction).
4. Filter for \`rn = 1\`.

\`\`\`sql
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
\`\`\`

---

## Question 2 (Q2)
### Requirement
> Return a side-by-side view of where each employee came from and where they are going for every row in \`emp_designation_log\`.
>
> **Output Format:**
> \`emp_id | effective_date | previous_designation | designation | next_designation\`
>
> _Where \`previous_designation\` is the designation held just before this row (for the same employee), and \`next_designation\` is the one that comes after. Return \`NULL\` where there is no previous or next._

### Solution Strategy
1. Use the SQL standard \`LAG()\` and \`LEAD()\` analytic window functions.
2. Partition the window by \`emp_id\` and order by \`effective_date ASC, txn_id ASC\`.
3. \`LAG(designation)\` fetches the immediately preceding designation for that employee.
4. \`LEAD(designation)\` fetches the immediately following designation for that employee.

\`\`\`sql
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
\`\`\`

---

## Question 4 (Q4)
### Requirement
> "For each project allocation, we want to know what designation the employee held at the time they were allocated to that project (\`allocation_start\`)."
>
> **Output Format:**
> \`allocation_id | emp_id | emp_name | project_name | allocated_role | allocation_start | designation_at_allocation\`

### Key Challenges & Edge Cases Handled
1. **Asynchronous Date Matching**: There is no direct foreign key for designation on the allocation table. The designation active at \`allocation_start\` is the record in \`emp_designation_log\` with the maximum \`effective_date\` that is <= \`allocation_start\`.
2. **Multiple Designation Changes on the Same Day**: If multiple transactions occur on the same \`effective_date\`, \`txn_id DESC\` resolves to the most recent transaction.
3. **No Prior Designation**: If an employee was allocated before any designation record existed, a \`LEFT JOIN\` preserves the allocation row and yields \`NULL\` for \`designation_at_allocation\`.
4. **Missing Employee Name in Allocation Table**: The query uses \`COALESCE\` with a subquery lookup to ensure \`emp_name\` is always populated even if no prior designation matches the \`LEFT JOIN\` date condition.

\`\`\`sql
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
\`\`\`

---

## Indexing & Performance Recommendations
1. \`CREATE INDEX idx_emp_desig ON emp_designation_log (emp_id, effective_date DESC, txn_id DESC);\`
2. \`CREATE INDEX idx_emp_alloc ON emp_allocation_log (emp_id, allocation_start);\`
`;

export const BonusDocsModal: React.FC<BonusDocsModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DOCS_MARKDOWN_CONTENT);
    setCopied(true);
    success('Markdown documentation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([DOCS_MARKDOWN_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BONUS_ANSWERS.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('BONUS_ANSWERS.md downloaded successfully');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="docs-modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="docs-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                BONUS_ANSWERS.md
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Solutions & Documentation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed logic breakdown, window analytical formulations, edge cases & indexing guide
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Copy Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy MD'}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/25 transition-all"
              title="Download BONUS_ANSWERS.md"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatted Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed custom-scrollbar">
          {/* Section 1: Schema */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              Data Schema Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 dark:text-slate-400">
              <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <p className="font-bold text-slate-900 dark:text-slate-200 mb-1">emp_designation_log</p>
                <p className="text-[11px]">Tracks designation events with <code className="text-indigo-600 dark:text-indigo-400">txn_id</code>, <code className="text-indigo-600 dark:text-indigo-400">emp_id</code>, <code className="text-indigo-600 dark:text-indigo-400">emp_name</code>, <code className="text-indigo-600 dark:text-indigo-400">designation</code>, <code className="text-indigo-600 dark:text-indigo-400">effective_date</code>.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <p className="font-bold text-slate-900 dark:text-slate-200 mb-1">emp_allocation_log</p>
                <p className="text-[11px]">Tracks project stints with <code className="text-indigo-600 dark:text-indigo-400">allocation_id</code>, <code className="text-indigo-600 dark:text-indigo-400">emp_id</code>, <code className="text-indigo-600 dark:text-indigo-400">project_name</code>, <code className="text-indigo-600 dark:text-indigo-400">allocated_role</code>, <code className="text-indigo-600 dark:text-indigo-400">allocation_start</code>, <code className="text-indigo-600 dark:text-indigo-400">allocation_end</code>.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Q1 */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Question 1: Current Designation of Every Employee
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Core Logic:</strong> Partition by <code className="text-indigo-600 dark:text-indigo-400">emp_id</code> and rank with <code className="text-indigo-600 dark:text-indigo-400">ROW_NUMBER() OVER (PARTITION BY emp_id ORDER BY effective_date DESC, txn_id DESC)</code> to safely break ties when multiple changes happen on the same date.
            </p>
          </div>

          {/* Section 3: Q2 */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              Question 2: Designation Timeline (LAG & LEAD)
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Core Logic:</strong> Uses analytic window functions <code className="text-indigo-600 dark:text-indigo-400">LAG(designation)</code> and <code className="text-indigo-600 dark:text-indigo-400">LEAD(designation)</code> partitioned by <code className="text-indigo-600 dark:text-indigo-400">emp_id</code> and ordered chronologically by <code className="text-indigo-600 dark:text-indigo-400">effective_date ASC, txn_id ASC</code>.
            </p>
          </div>

          {/* Section 4: Q4 */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Question 4: Active Designation at Allocation Start Date
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              <strong>Core Logic:</strong> Performs non-equi join on <code className="text-indigo-600 dark:text-indigo-400">d.effective_date &lt;= a.allocation_start</code>, ranks matches partitioned by <code className="text-indigo-600 dark:text-indigo-400">allocation_id</code> descending by date and txn_id, and selects <code className="text-indigo-600 dark:text-indigo-400">rn = 1</code> with a <code className="text-indigo-600 dark:text-indigo-400">LEFT JOIN</code> fallback for employees assigned before their first recorded designation.
            </p>
          </div>

          {/* Section 5: Performance & Indexing */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-2 bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 dark:from-indigo-950/20 dark:to-emerald-950/20">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Indexing Recommendations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <li>CREATE INDEX idx_emp_desig ON emp_designation_log (emp_id, effective_date DESC, txn_id DESC);</li>
              <li>CREATE INDEX idx_emp_alloc ON emp_allocation_log (emp_id, allocation_start);</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Assessment Technical Solutions Guide</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
