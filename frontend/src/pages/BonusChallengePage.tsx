import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Database,
  HelpCircle,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Table,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { bonusApi } from "../api/bonus.api";
import { useToast } from "../contexts/ToastContext";
import { BonusQueryResult, BonusTableData } from "../types";

export const BonusChallengePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "q1" | "q2" | "q4" | "strategy" | "raw"
  >("q1");
  const [rawData, setRawData] = useState<BonusTableData | null>(null);
  const [q1Result, setQ1Result] = useState<BonusQueryResult | null>(null);
  const [q2Result, setQ2Result] = useState<BonusQueryResult | null>(null);
  const [q4Result, setQ4Result] = useState<BonusQueryResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
    success("Copied to clipboard");
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
              Interactive execution, deep architectural reasoning, and detailed
              breakdown of window functions, timeline tracking, and
              point-in-time joins for Questions Q1, Q2, and Q4.
            </p>
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
          data-testid="strategy-tab-btn"
          onClick={() => setActiveTab("strategy")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === "strategy"
              ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span>Strategy & Reasoning</span>
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

          {/* Q4 STRATEGY & REASONING TAB */}
          {activeTab === "strategy" && (
            <div className="space-y-8 animate-fade-in">
              {/* Architecture Intro Hero */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-emerald-500/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Assessment Architectural Deep-Dive
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      Q4 Join Strategy, Temporal Logic & Edge Case Handling
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Detailed answers to the core questions posed in the
                      assessment guidelines: handling multiple designations over
                      time, deriving active state without an explicit{" "}
                      <code className="text-indigo-600 dark:text-indigo-400">
                        end_date
                      </code>
                      , and safely managing missing historical records with{" "}
                      <code className="text-indigo-600 dark:text-indigo-400">
                        LEFT JOIN
                      </code>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Core Considerations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question 1 Card */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm mb-3">
                      01
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      Multiple Designations Over Time
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                      "An employee may have had multiple designations over time.
                      Only one was active on allocation_start."
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                      <p>
                        <strong>The Challenge:</strong> An employee like Alice (
                        <code className="text-indigo-600 dark:text-indigo-400">
                          EMP001
                        </code>
                        ) has multiple promotion events:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1 font-mono">
                        <li>2024-02-01: Associate Developer</li>
                        <li>2024-02-05: Mid Developer</li>
                        <li>2024-02-10: Senior Developer</li>
                      </ul>
                      <p>
                        When allocated to <em>Project Alpha</em> on{" "}
                        <strong>2024-02-03</strong>, only{" "}
                        <strong>Associate Developer</strong> was active (she
                        became Mid Developer 2 days later).
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
                    <strong>Solution:</strong> Filter candidates with{" "}
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono">
                      effective_date &lt;= allocation_start
                    </code>{" "}
                    and rank with{" "}
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono">
                      ROW_NUMBER() OVER (PARTITION BY allocation_id ORDER BY
                      effective_date DESC, txn_id DESC)
                    </code>
                    . Filtering for{" "}
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono">
                      rn = 1
                    </code>{" "}
                    isolates the exact active title.
                  </div>
                </div>

                {/* Question 2 Card */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm mb-3">
                      02
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      Active State Without End Date
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                      "The designation table does not store an end date — you
                      need to figure out the active designation purely from the
                      history of rows."
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                      <p>
                        <strong>The Challenge:</strong> The table is an
                        append-only event log. Titles remain valid indefinitely
                        until superseded by a subsequent record with a later
                        effective date.
                      </p>
                      <p>
                        We evaluated 3 distinct architectural patterns to solve
                        this point-in-time state lookup:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                        <li>
                          <strong>Strategy A (Recommended):</strong> Non-equi
                          join + CTE window ranking.
                        </li>
                        <li>
                          <strong>Strategy B:</strong> Range synthesis using{" "}
                          <code className="text-purple-500 font-mono">
                            LEAD(effective_date)
                          </code>
                          .
                        </li>
                        <li>
                          <strong>Strategy C:</strong> Correlated scalar
                          subquery with{" "}
                          <code className="text-purple-500 font-mono">
                            LIMIT 1
                          </code>
                          .
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 font-medium">
                    <strong>Solution:</strong> Strategy A provides clean ANSI
                    standard SQL with $O(N \log N)$ complexity and full index
                    utilization via{" "}
                    <code className="text-purple-600 dark:text-purple-400 font-mono">
                      (emp_id, effective_date DESC, txn_id DESC)
                    </code>
                    .
                  </div>
                </div>

                {/* Question 3 Card */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md flex flex-col justify-between space-y-4">
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mb-3">
                      03
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      No Prior Designation Record
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                      "What happens if an employee has no designation record
                      before their allocation_start?"
                    </p>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                      <p>
                        <strong>The Challenge:</strong> If an employee was
                        assigned to a project prior to their initial designation
                        record, or onboarded as an unclassified contractor
                        without an initial designation log:
                      </p>
                      <p>
                        An{" "}
                        <code className="text-rose-500 font-semibold font-mono">
                          INNER JOIN
                        </code>{" "}
                        would completely discard the project allocation from the
                        result set, causing false data loss in executive HR
                        reporting!
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                    <strong>Solution:</strong> We apply a{" "}
                    <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                      LEFT JOIN
                    </code>{" "}
                    from{" "}
                    <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                      emp_allocation_log
                    </code>{" "}
                    to the ranked CTE. All allocation records are strictly
                    preserved, safely returning{" "}
                    <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                      NULL
                    </code>{" "}
                    for missing designations without dropping rows.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RAW TABLES VIEW */}
          {activeTab === "raw" && rawData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
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
    </div>
  );
};
