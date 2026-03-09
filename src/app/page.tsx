"use client";

import { useState } from "react";
import { Search, TrendingUp, AlertCircle, Plus, X, BarChart2 } from "lucide-react";
import clsx from "clsx";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface RatioMetrics {
  currentRatio: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
}

interface HistoricalPoint {
  year: number;
  metrics: RatioMetrics;
  raw: {
    currentAssets: number;
    currentLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;
  };
}

interface CompanyData {
  ticker: string;
  name: string;
  history: HistoricalPoint[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalYear, setGlobalYear] = useState<number | null>(null);
  
  // Find the boundary years across all loaded companies
  const allYears = companies.flatMap(c => c.history.map(h => h.year));
  const minYear = allYears.length > 0 ? Math.min(...allYears) : new Date().getFullYear() - 4;
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear();
  
  const activeYear = globalYear ?? maxYear;

  const fetchCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (companies.length >= 2) {
      setError("You can only compare up to 2 companies at a time.");
      return;
    }

    if (companies.some((c) => c.ticker === query.toUpperCase())) {
      setError("Company already added.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/financials?ticker=${query}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch data");

      setCompanies((prev) => {
        const newCompanies = [...prev, data];
        // Ensure global year aligns with latest data default if null
        if (globalYear === null) {
          const maxDataYear = Math.max(...data.history.map((h: any) => h.year));
          setGlobalYear(maxDataYear);
        }
        return newCompanies;
      });
      setQuery("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeCompany = (ticker: string) => {
    setCompanies((prev) => prev.filter((c) => c.ticker !== ticker));
  };

  const getActiveHistoricalPoint = (company: CompanyData, targetYear: number) => {
    // Find exact year, or fallback to the closest available year
    let point = company.history.find(h => h.year === targetYear);
    if (!point && company.history.length > 0) {
      // Find closest year
      point = company.history.reduce((prev, curr) => 
        Math.abs(curr.year - targetYear) < Math.abs(prev.year - targetYear) ? curr : prev
      );
    }
    return point;
  };

  const determineWinner = (metricKey: keyof RatioMetrics) => {
    if (companies.length !== 2) return null;
    const pt1 = getActiveHistoricalPoint(companies[0], activeYear);
    const pt2 = getActiveHistoricalPoint(companies[1], activeYear);

    if (!pt1 || !pt2) return null;

    const val1 = pt1.metrics[metricKey];
    const val2 = pt2.metrics[metricKey];

    if (val1 === null || val2 === null) return null;

    if (metricKey === "debtToEquity") {
      // Lower is better for Debt-to-Equity
      if (val1 < val2) return companies[0].ticker;
      if (val2 < val1) return companies[1].ticker;
    } else {
      // Higher is better for Current Ratio & ROE
      if (val1 > val2) return companies[0].ticker;
      if (val2 > val1) return companies[1].ticker;
    }
    return "TIE";
  };

  return (
    <main className="min-h-screen text-slate-100 p-6 sm:p-12 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <BarChart2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-indigo-400">
            Ratio Scanner
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
            Search for a company to view its financial health. Add a second to compare them side-by-side.
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative glass-card p-2 rounded-2xl flex items-center transition-all duration-300 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.3)] focus-within:border-indigo-500/50">
          <form onSubmit={fetchCompany} className="flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 ml-4 mr-3" />
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 py-3 text-lg font-medium"
              placeholder="Enter ticker (e.g. AAPL)"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              disabled={loading || companies.length >= 2}
            />
            <button
              type="submit"
              disabled={loading || !query.trim() || companies.length >= 2}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : companies.length === 1 ? (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Compare
                </>
              ) : (
                "Search"
              )}
            </button>
          </form>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="max-w-xl mx-auto glass-card border-red-500/30 bg-red-500/10 p-4 rounded-xl flex items-start text-red-400">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Display Area */}
        {companies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            {companies.map((company) => {
              const activePoint = getActiveHistoricalPoint(company, activeYear);
              if (!activePoint) return null;

              return (
              <div key={company.ticker} className="relative group">
                {/* Remove button */}
                <button
                  onClick={() => removeCompany(company.ticker)}
                  className="absolute -top-3 -right-3 z-10 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-full shadow-lg transition-colors hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                  aria-label="Remove company"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Company Header Card */}
                <div className="glass-card rounded-t-3xl p-8 border-b-0 relative overflow-hidden flex justify-between items-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{company.name}</h2>
                    <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold tracking-wider text-slate-300">
                      {company.ticker}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-slate-400 block mb-1">Fiscal Year</span>
                    <span className="text-2xl font-black text-indigo-400">{activePoint.year}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4 pt-4">
                  <MetricCard
                    title="Current Ratio"
                    value={activePoint.metrics.currentRatio}
                    format="number"
                    isWinner={determineWinner("currentRatio") === company.ticker}
                    isTie={determineWinner("currentRatio") === "TIE"}
                    description={`A Current Ratio of ${activePoint.metrics.currentRatio?.toFixed(2) || "N/A"} means the company has $${(activePoint.metrics.currentRatio || 0).toFixed(2)} in short-term assets for every $1 of short-term debt.`}
                    goodThreshold={1.5}
                    metricType="higher-is-better"
                    targetCalculator={{
                      type: "currentRatio",
                      raw: activePoint.raw
                    }}
                    history={company.history}
                    metricKey="currentRatio"
                    activeYear={activeYear}
                  />
                  <MetricCard
                    title="Debt-to-Equity Ratio"
                    value={activePoint.metrics.debtToEquity}
                    format="number"
                    isWinner={determineWinner("debtToEquity") === company.ticker}
                    isTie={determineWinner("debtToEquity") === "TIE"}
                    description={`For every $1 of equity, the company uses $${(activePoint.metrics.debtToEquity || 0).toFixed(2)} in debt.`}
                    goodThreshold={2.0}
                    metricType="lower-is-better"
                    targetCalculator={{
                      type: "debtToEquity",
                      raw: activePoint.raw
                    }}
                    history={company.history}
                    metricKey="debtToEquity"
                    activeYear={activeYear}
                  />
                  <MetricCard
                    title="Return on Equity (ROE)"
                    value={activePoint.metrics.returnOnEquity}
                    format="percentage"
                    isWinner={determineWinner("returnOnEquity") === company.ticker}
                    isTie={determineWinner("returnOnEquity") === "TIE"}
                    description={`Returns ${( (activePoint.metrics.returnOnEquity || 0) * 100 ).toFixed(1)}% of profit for every dollar invested by shareholders.`}
                    goodThreshold={0.15}
                    metricType="higher-is-better"
                    history={company.history}
                    metricKey="returnOnEquity"
                    activeYear={activeYear}
                  />
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Timeline Slider */}
        {companies.length > 0 && allYears.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-4xl mx-auto flex items-center gap-6">
              <span className="text-slate-400 font-mono text-sm font-semibold">{minYear}</span>
              <input 
                type="range"
                className="flex-1 w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                min={minYear}
                max={maxYear}
                step={1}
                value={activeYear}
                onChange={(e) => setGlobalYear(parseInt(e.target.value))}
              />
              <span className="text-slate-400 font-mono text-sm font-semibold">{maxYear}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  format,
  isWinner,
  isTie,
  description,
  goodThreshold,
  metricType,
  targetCalculator,
  history,
  metricKey,
  activeYear,
}: {
  title: string;
  value: number | null;
  format: "number" | "percentage";
  isWinner: boolean;
  isTie: boolean;
  description: string;
  goodThreshold: number;
  metricType: "higher-is-better" | "lower-is-better";
  targetCalculator?: {
    type: "currentRatio" | "debtToEquity";
    raw: {
      currentAssets: number;
      currentLiabilities: number;
      totalLiabilities: number;
      totalEquity: number;
    };
  };
  history?: HistoricalPoint[];
  metricKey?: keyof RatioMetrics;
  activeYear?: number;
}) {
  const [targetRatioStr, setTargetRatioStr] = useState("");

  if (value === null) {
    return (
      <div className="glass-card p-6 rounded-2xl flex flex-col justify-center">
        <h3 className="text-slate-400 font-semibold mb-2">{title}</h3>
        <p className="text-2xl font-bold text-slate-500">Data Unavailable</p>
      </div>
    );
  }

  const isGood = metricType === "higher-is-better" ? value >= goodThreshold : value <= goodThreshold;
  const displayNumber = format === "percentage" ? `${(value * 100).toFixed(2)}%` : value.toFixed(2);

  let targetSentence = "";
  if (targetCalculator && targetRatioStr.trim() !== "") {
    const targetRatio = parseFloat(targetRatioStr);
    if (!isNaN(targetRatio)) {
      if (targetCalculator.type === "currentRatio") {
        const cl = targetCalculator.raw.currentLiabilities;
        const ca = targetCalculator.raw.currentAssets;
        const targetCa = targetRatio * cl;
        const diff = targetCa - ca;
        if (diff > 0) {
          targetSentence = `To reach a ${targetRatio} Current Ratio, this company must acquire $${formatLargeNumber(diff)} in new Current Assets.`;
        } else if (diff < 0) {
          targetSentence = `To reach a ${targetRatio} Current Ratio, this company must reduce its Current Assets by $${formatLargeNumber(Math.abs(diff))}.`;
        } else {
          targetSentence = `The company is exactly at a ${targetRatio} Current Ratio.`;
        }
      } else if (targetCalculator.type === "debtToEquity") {
        const te = targetCalculator.raw.totalEquity;
        const tl = targetCalculator.raw.totalLiabilities;
        const targetTl = targetRatio * te;
        const diff = targetTl - tl;
        if (diff > 0) {
          targetSentence = `To reach a ${targetRatio} Debt-to-Equity Ratio, this company must acquire $${formatLargeNumber(diff)} in new Debt.`;
        } else if (diff < 0) {
          targetSentence = `To reach a ${targetRatio} Debt-to-Equity Ratio, this company must pay down $${formatLargeNumber(Math.abs(diff))} of Debt.`;
        } else {
          targetSentence = `The company is exactly at a ${targetRatio} Debt-to-Equity Ratio.`;
        }
      }
    }
  }

  // Chart configuration
  const chartDataObj = {
    labels: history?.map(h => h.year) || [],
    datasets: [
      {
        fill: true,
        label: title,
        data: history?.map(h => {
          const m = h.metrics[metricKey as keyof RatioMetrics];
          if (m === null) return null;
          return format === 'percentage' ? m * 100 : m;
        }) || [],
        borderColor: isGood ? 'rgba(52, 211, 153, 0.8)' : 'rgba(251, 113, 133, 0.8)',
        backgroundColor: isGood ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)',
        tension: 0.4,
        pointBackgroundColor: (ctx: any) => {
          const index = ctx.dataIndex;
          const year = history?.[index]?.year;
          return year === activeYear ? (isGood ? 'rgb(52, 211, 153)' : 'rgb(251, 113, 133)') : 'rgba(0,0,0,0)';
        },
        pointBorderColor: (ctx: any) => {
          const index = ctx.dataIndex;
          const year = history?.[index]?.year;
          return year === activeYear ? '#fff' : 'rgba(0,0,0,0)';
        },
        pointRadius: (ctx: any) => {
          const index = ctx.dataIndex;
          const year = history?.[index]?.year;
          return year === activeYear ? 6 : 0;
        },
        pointHoverRadius: 8
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(51, 65, 85, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: { 
        display: false,
        grid: { display: false }
      },
      y: { 
        display: false,
        grid: { display: false }
      }
    },
    animation: {
      duration: 500,
    }
  };

  return (
    <div className={clsx(
      "glass-card p-6 rounded-2xl relative transition-all duration-500 overflow-hidden group",
      isWinner ? "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50" : ""
    )}>
      {isWinner && (
        <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 flex items-center z-10">
          <TrendingUp className="w-3 h-3 mr-1" /> WINNER
        </div>
      )}
      {isTie && (
        <div className="absolute top-4 right-4 bg-slate-500/20 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-500/30 z-10">
          TIE
        </div>
      )}
      
      <div className="relative z-10">
        <h3 className="text-slate-400 font-medium tracking-wide text-sm uppercase mb-1">{title}</h3>
        <div className={clsx("text-4xl font-extrabold mb-3 flex items-baseline gap-2 transition-colors duration-500", isGood ? "text-emerald-400" : "text-rose-400")}>
          {displayNumber}
        </div>
        <p className={clsx("text-sm text-slate-400 leading-relaxed max-w-[90%] font-medium transition-opacity duration-300", targetCalculator ? "mb-4" : "")}>
          {description}
        </p>

        {targetCalculator && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 relative z-10 bg-slate-900/40 p-4 rounded-xl shadow-inner border border-slate-800/80">
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors cursor-pointer" htmlFor={`target-${targetCalculator.type}`}>
                Target Ratio
              </label>
              <input
                id={`target-${targetCalculator.type}`}
                type="number"
                step="0.01"
                className="bg-slate-800/60 border border-slate-700 focus:border-indigo-500 outline-none text-slate-200 placeholder-slate-600 px-3 py-1.5 rounded-lg text-sm w-24 font-mono transition-all duration-200 shadow-sm"
                placeholder="e.g. 1.5"
                value={targetRatioStr}
                onChange={(e) => setTargetRatioStr(e.target.value)}
              />
            </div>
            {targetSentence && (
              <p className="text-sm font-medium text-emerald-400/90 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
                {targetSentence}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chart.js Background Canvas */}
      {history && history.length > 1 && (
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none flex items-end">
           <div className="w-full h-2/3">
              <Line data={chartDataObj} options={chartOptions} />
           </div>
        </div>
      )}
      
      {/* Decorative background glow based on sentiment if winner */}
      {isWinner && <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0" />}
    </div>
  );
}

function formatLargeNumber(num: number): string {
  const absNum = Math.abs(num);
  if (absNum >= 1e12) return (absNum / 1e12).toFixed(1).replace(/\.0$/, '') + " Trillion";
  if (absNum >= 1e9) return (absNum / 1e9).toFixed(1).replace(/\.0$/, '') + " Billion";
  if (absNum >= 1e6) return (absNum / 1e6).toFixed(1).replace(/\.0$/, '') + " Million";
  return absNum.toLocaleString();
}
