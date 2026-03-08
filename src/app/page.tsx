"use client";

import { useState } from "react";
import { Search, TrendingUp, AlertCircle, Plus, X, BarChart2 } from "lucide-react";
import clsx from "clsx";

interface RatioMetrics {
  currentRatio: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
}

interface CompanyData {
  ticker: string;
  name: string;
  metrics: RatioMetrics;
  raw: {
    currentAssets: number;
    currentLiabilities: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;
  };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setCompanies((prev) => [...prev, data]);
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

  const determineWinner = (metricKey: keyof RatioMetrics) => {
    if (companies.length !== 2) return null;
    const val1 = companies[0].metrics[metricKey];
    const val2 = companies[1].metrics[metricKey];

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {companies.map((company) => (
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
                <div className="glass-card rounded-t-3xl p-8 border-b-0 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <h2 className="text-3xl font-bold text-white mb-2">{company.name}</h2>
                  <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold tracking-wider text-slate-300">
                    {company.ticker}
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4 pt-4">
                  <MetricCard
                    title="Current Ratio"
                    value={company.metrics.currentRatio}
                    format="number"
                    isWinner={determineWinner("currentRatio") === company.ticker}
                    isTie={determineWinner("currentRatio") === "TIE"}
                    description={`A Current Ratio of ${company.metrics.currentRatio?.toFixed(2) || "N/A"} means the company has $${(company.metrics.currentRatio || 0).toFixed(2)} in short-term assets for every $1 of short-term debt.`}
                    goodThreshold={1.5}
                    metricType="higher-is-better"
                  />
                  <MetricCard
                    title="Debt-to-Equity Ratio"
                    value={company.metrics.debtToEquity}
                    format="number"
                    isWinner={determineWinner("debtToEquity") === company.ticker}
                    isTie={determineWinner("debtToEquity") === "TIE"}
                    description={`For every $1 of equity, the company uses $${(company.metrics.debtToEquity || 0).toFixed(2)} in debt.`}
                    goodThreshold={2.0}
                    metricType="lower-is-better"
                  />
                  <MetricCard
                    title="Return on Equity (ROE)"
                    value={company.metrics.returnOnEquity}
                    format="percentage"
                    isWinner={determineWinner("returnOnEquity") === company.ticker}
                    isTie={determineWinner("returnOnEquity") === "TIE"}
                    description={`Returns ${( (company.metrics.returnOnEquity || 0) * 100 ).toFixed(1)}% of profit for every dollar invested by shareholders.`}
                    goodThreshold={0.15}
                    metricType="higher-is-better"
                  />
                </div>
              </div>
            ))}
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
}: {
  title: string;
  value: number | null;
  format: "number" | "percentage";
  isWinner: boolean;
  isTie: boolean;
  description: string;
  goodThreshold: number;
  metricType: "higher-is-better" | "lower-is-better";
}) {
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

  return (
    <div className={clsx(
      "glass-card p-6 rounded-2xl relative transition-all duration-500 overflow-hidden",
      isWinner ? "border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/50" : ""
    )}>
      {isWinner && (
        <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" /> WINNER
        </div>
      )}
      {isTie && (
        <div className="absolute top-4 right-4 bg-slate-500/20 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-500/30">
          TIE
        </div>
      )}
      
      <h3 className="text-slate-400 font-medium tracking-wide text-sm uppercase mb-1">{title}</h3>
      <div className={clsx("text-4xl font-extrabold mb-3 flex items-baseline gap-2", isGood ? "text-emerald-400" : "text-slate-200")}>
        {displayNumber}
      </div>
      <p className="text-sm text-slate-400 leading-relaxed max-w-[90%] font-medium">
        {description}
      </p>
      
      {/* Decorative background glow based on sentiment if winner */}
      {isWinner && <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />}
    </div>
  );
}
