import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Download,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Table,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { bonusApi } from "../api/bonus.api";
import { BonusDocsModal } from "../components/BonusDocsModal";
import { BonusSqlModal } from "../components/BonusSqlModal";
import { useToast } from "../contexts/ToastContext";
import { BonusQueryResult, BonusTableData } from "../types";

export const BonusChallengePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"q1" | "q2" | "q4" | "raw">("q1");
  const [rawData, setRawData] = useState<BonusTableData | null>(null);
  const [q1Result, setQ1Result] = useState<BonusQueryResult | null>(null);
  const [q2Result, setQ2Result] = useState<BonusQueryResult | null>(null);
  const [q4Result, setQ4Result] = useState<BonusQueryResult | null>(null);

  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedQuery, setCopiedQuery] = useState("");

  const { success, error } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const [rawRes, q1Res, q2Res, q4Res] = await Promise.all([
        bonusApi.getBonusData(),
        bonusApi.runQ1(),
        bonusApi.runQ2(),
        bonusApi.runQ4(),
      ]);

      if (rawRes.success) setRawData(rawRes.data);
      if (q1Res.success) setQ1Result(q1Res.data);
      if (q2Res.success) setQ2Result(q2Res.data);
      if (q4Res.success) setQ4Result(q4Res.data);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        "Failed to load bonus challenge data. Please check your connection.";
      setFetchError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedQuery(id);
    success("SQL Query copied to clipboard");
    setTimeout(() => setCopiedQuery(""), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 animate-fade-in space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-purple-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 mb-3 border border-emerald-200 dark:border-emerald-800">
              <Database className="w-3.5 h-3.5" />
              Assessment Bonus Section • SQL Analytics
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Employee Designation & Project Allocation Queries
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Interactive execution and detailed breakdown of window functions,
              timeline tracking, and date-range joins for Questions Q1, Q2, and
              Q4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsDocsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/40 text-slate-800 dark:text-slate-200 transition-all shadow-sm active:scale-95"
            >
              <Code2 className="w-4 h-4 text-emerald-500" />
              View BONUS_ANSWERS.md
            </button>
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-indigo-500/40 text-slate-800 dark:text-slate-200 transition-all shadow-sm active:scale-95"
            >
              <Database className="w-4 h-4 text-indigo-500" />
              View bonus_solution.sql
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 backdrop-blur-md overflow-x-auto">
        <button
          onClick={() => setActiveTab("q1")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "q1"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Q1: Current Designation
        </button>

        <button
          onClick={() => setActiveTab("q2")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "q2"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4 text-purple-500" />
          Q2: Timeline (LAG / LEAD)
        </button>

        <button
          onClick={() => setActiveTab("q4")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "q4"
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Q4: Designation at Allocation</span>
        </button>

        <button
          onClick={() => setActiveTab("raw")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "raw"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Table className="w-4 h-4 text-slate-500" />
          Raw Sample Tables (24 rows)
        </button>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            Executing database analytics...
          </p>
        </div>
      ) : fetchError && !rawData ? (
        <div className="py-16 text-center glass-card rounded-3xl p-8 border border-rose-200 dark:border-rose-900/40 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-4 ring-rose-500/10">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Unable to Load Bonus Analytics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            {fetchError}
          </p>
          <button
            onClick={() => fetchInitialData()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-500/25 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Analytics
          </button>
        </div>
      ) : (
        <>
          {/* QUESTION 1 VIEW */}
          {activeTab === "q1" && q1Result && (
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Question 1: Current Designation of Every Employee
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  <strong>Requirement:</strong> Write a query to return the
                  current designation of every employee — defined as the
                  designation from their most recent{" "}
                  <code className="text-indigo-600 dark:text-indigo-400">
                    effective_date
                  </code>
                  .
                </p>

                {/* SQL Code Block */}
                <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                  <button
                    onClick={() => handleCopy(q1Result.sql, "q1")}
                    className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    {copiedQuery === "q1" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedQuery === "q1" ? "Copied" : "Copy SQL"}
                  </button>
                  <pre className="text-emerald-400">{q1Result.sql}</pre>
                </div>
              </div>

              {/* Execution Results Table */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Query Execution Output ({q1Result.count} rows returned)
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">emp_id</th>
                        <th className="px-4 py-3">emp_name</th>
                        <th className="px-4 py-3">current_designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {q1Result.rows.map((row: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {row.emp_id}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                            {row.emp_name}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {row.current_designation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 2 VIEW */}
          {activeTab === "q2" && q2Result && (
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Question 2: Designation Timeline (Side-by-Side View)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  <strong>Requirement:</strong> A side-by-side view showing
                  previous, current, and next designation for every row using{" "}
                  <code className="text-indigo-600 dark:text-indigo-400">
                    LAG()
                  </code>{" "}
                  and{" "}
                  <code className="text-indigo-600 dark:text-indigo-400">
                    LEAD()
                  </code>{" "}
                  analytic window functions.
                </p>

                {/* SQL Code Block */}
                <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                  <button
                    onClick={() => handleCopy(q2Result.sql, "q2")}
                    className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    {copiedQuery === "q2" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedQuery === "q2" ? "Copied" : "Copy SQL"}
                  </button>
                  <pre className="text-emerald-400">{q2Result.sql}</pre>
                </div>
              </div>

              {/* Execution Results Table */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Query Execution Output ({q2Result.count} timeline
                    transitions)
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider sticky top-0">
                      <tr>
                        <th className="px-4 py-3">emp_id</th>
                        <th className="px-4 py-3">effective_date</th>
                        <th className="px-4 py-3">previous_designation</th>
                        <th className="px-4 py-3">designation</th>
                        <th className="px-4 py-3">next_designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {q2Result.rows.map((row: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {row.emp_id}
                          </td>
                          <td className="px-4 py-2 text-slate-500">
                            {String(row.effective_date).substring(0, 10)}
                          </td>
                          <td className="px-4 py-2 text-slate-400 italic">
                            {row.previous_designation || "NULL"}
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-900 dark:text-white bg-indigo-50/50 dark:bg-indigo-950/30">
                            {row.designation}
                          </td>
                          <td className="px-4 py-2 text-slate-400 italic">
                            {row.next_designation || "NULL"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* QUESTION 4 VIEW */}
          {activeTab === "q4" && q4Result && (
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Question 4: Active Designation at Allocation Start
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  <strong>Requirement:</strong> "For each project allocation, we
                  want to know what designation the employee held at the time
                  they were allocated to that project (
                  <code className="text-indigo-600 dark:text-indigo-400">
                    allocation_start
                  </code>
                  )."
                </p>

                {/* Key Insights Alert */}
                <div className="mb-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">
                    Key Handling & Logic:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                    <li>
                      Joins{" "}
                      <code className="text-indigo-500">
                        emp_allocation_log
                      </code>{" "}
                      with{" "}
                      <code className="text-indigo-500">
                        emp_designation_log
                      </code>{" "}
                      where{" "}
                      <code className="text-indigo-500">
                        effective_date &lt;= allocation_start
                      </code>
                      .
                    </li>
                    <li>
                      Ranks matched designations by{" "}
                      <code className="text-indigo-500">
                        effective_date DESC, txn_id DESC
                      </code>{" "}
                      to cleanly break ties when multiple designation changes
                      occur on the same day.
                    </li>
                    <li>
                      Uses <code className="text-indigo-500">LEFT JOIN</code> to
                      ensure allocations prior to any designation record return{" "}
                      <code className="text-indigo-500">NULL</code> without
                      dropping rows.
                    </li>
                  </ul>
                </div>

                {/* SQL Code Block */}
                <div className="relative rounded-2xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                  <button
                    onClick={() => handleCopy(q4Result.sql, "q4")}
                    className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    {copiedQuery === "q4" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedQuery === "q4" ? "Copied" : "Copy SQL"}
                  </button>
                  <pre className="text-emerald-400">{q4Result.sql}</pre>
                </div>
              </div>

              {/* Execution Results Table */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Query Execution Output ({q4Result.count} project allocations
                    matched)
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">allocation_id</th>
                        <th className="px-4 py-3">emp_id</th>
                        <th className="px-4 py-3">emp_name</th>
                        <th className="px-4 py-3">project_name</th>
                        <th className="px-4 py-3">allocated_role</th>
                        <th className="px-4 py-3">allocation_start</th>
                        <th className="px-4 py-3">designation_at_allocation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {q4Result.rows.map((row: any, idx: number) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {row.allocation_id}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-500">
                            {row.emp_id}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                            {row.emp_name}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-purple-600 dark:text-purple-400">
                            {row.project_name}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                            {row.allocated_role}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {String(row.allocation_start).substring(0, 10)}
                          </td>
                          <td className="px-4 py-2.5 font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30">
                            {row.designation_at_allocation || "NULL"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RAW TABLES VIEW */}
          {activeTab === "raw" && rawData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Designation Log Table */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Table 1: emp_designation_log (
                  {rawData.empDesignationLog.length} rows)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 sticky top-0 font-bold">
                      <tr>
                        <th className="px-3 py-2">txn_id</th>
                        <th className="px-3 py-2">emp_id</th>
                        <th className="px-3 py-2">emp_name</th>
                        <th className="px-3 py-2">designation</th>
                        <th className="px-3 py-2">effective_date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {rawData.empDesignationLog.map((r, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 font-mono">{r.txn_id}</td>
                          <td className="px-3 py-1.5 font-mono">{r.emp_id}</td>
                          <td className="px-3 py-1.5 truncate max-w-[120px]">
                            {r.emp_name}
                          </td>
                          <td className="px-3 py-1.5">{r.designation}</td>
                          <td className="px-3 py-1.5">
                            {String(r.effective_date).substring(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Allocation Log Table */}
              <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Table 2: emp_allocation_log ({rawData.empAllocationLog.length}{" "}
                  rows)
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800/60 sticky top-0 font-bold">
                      <tr>
                        <th className="px-3 py-2">allocation_id</th>
                        <th className="px-3 py-2">emp_id</th>
                        <th className="px-3 py-2">project_name</th>
                        <th className="px-3 py-2">allocated_role</th>
                        <th className="px-3 py-2">allocation_start</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {rawData.empAllocationLog.map((r, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5 font-mono">
                            {r.allocation_id}
                          </td>
                          <td className="px-3 py-1.5 font-mono">{r.emp_id}</td>
                          <td className="px-3 py-1.5 font-bold text-purple-600 dark:text-purple-400">
                            {r.project_name}
                          </td>
                          <td className="px-3 py-1.5">{r.allocated_role}</td>
                          <td className="px-3 py-1.5">
                            {String(r.allocation_start).substring(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bonus Solution SQL Modal */}
      <BonusSqlModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Bonus Documentation Modal */}
      <BonusDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
      />
    </div>
  );
};
