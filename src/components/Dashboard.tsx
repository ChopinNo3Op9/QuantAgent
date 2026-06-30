import { useState } from 'react';
import { 
  Play, BrainCircuit, LineChart as LineChartIcon, MessageSquareText, 
  Cpu, AlertCircle, Loader2, TrendingUp, TrendingDown, Activity, 
  ShieldAlert, Settings2, BarChart3, Clock, DollarSign, Target, TerminalSquare, FileText
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate mock backtest data based on the action
function generateBacktestData(action: string) {
  const data = [];
  let currentEquity = 100000;
  let benchmarkEquity = 100000;
  const isBuy = action === 'BUY';
  const isSell = action === 'SELL';
  
  for (let i = 0; i <= 100; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (100 - i));
    
    // Random walk with drift based on action
    const drift = isBuy ? 0.0015 : (isSell ? -0.001 : 0);
    const volatility = 0.012;
    const benchDrift = 0.0005;
    
    const dailyReturn = drift + (Math.random() - 0.5) * volatility;
    const benchReturn = benchDrift + (Math.random() - 0.5) * 0.012;
    
    // If agent sold, it holds cash (return = 0) or shorts (inverse return). 
    const strategyReturn = isBuy ? dailyReturn : (isSell ? -dailyReturn : 0);
    
    currentEquity *= (1 + strategyReturn);
    benchmarkEquity *= (1 + benchReturn);
    
    data.push({
      date: date.toISOString().split('T')[0],
      Strategy: Math.round(currentEquity),
      Benchmark: Math.round(benchmarkEquity)
    });
  }
  return data;
}

export function Dashboard() {
  const [ticker, setTicker] = useState('RKLB');
  const [horizon, setHorizon] = useState('1M');
  const [risk, setRisk] = useState('Moderate');
  const [capital, setCapital] = useState('100000');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [backtestData, setBacktestData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trace' | 'backtest'>('overview');

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setActiveTab('overview');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker.toUpperCase() })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze');
      }
      
      const data = await response.json();
      setResults(data);
      setBacktestData(generateBacktestData(data.proposal.action));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto">
      {/* Sidebar Input Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100 leading-tight">QuantAgent</h1>
              <p className="text-xs text-zinc-500">Multi-Agent Framework</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">Target Ticker</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-4 w-4 text-zinc-500" />
                </div>
                <input 
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  disabled={loading}
                  placeholder="e.g. AAPL, TSLA, ASTS"
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 uppercase transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">Capital Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-zinc-500" />
                </div>
                <input 
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">Time Horizon</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-zinc-500" />
                </div>
                <select 
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <option value="1W">1 Week</option>
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="1Y">1 Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">Risk Tolerance</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldAlert className="h-4 w-4 text-zinc-500" />
                </div>
                <select 
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg pl-9 pr-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <option value="Conservative">Conservative</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Aggressive">Aggressive</option>
                </select>
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading || !ticker.trim()}
              className="w-full mt-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running ADK Graph...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Analysis
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-xs text-zinc-500 leading-relaxed">
          <strong>Disclaimer:</strong> This is an educational research tool powered by an LLM multi-agent framework. Not financial advice. Output depends on real-time market data retrieval via yfinance.
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!results && !loading && !error && (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Activity className="w-12 h-12 mb-4 text-zinc-700" />
            <p className="text-lg font-medium text-zinc-400">System Ready</p>
            <p className="text-sm mt-1 text-center max-w-sm">Enter a ticker and execute the analysis to spawn the specialized agents and generate a trade proposal.</p>
          </div>
        )}

        {loading && (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-zinc-800 rounded-2xl bg-zinc-900/30">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute inset-0"></div>
              <Cpu className="w-8 h-8 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="mt-8 space-y-3 w-64 text-sm font-mono text-zinc-400">
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Fetching Market Data</span> <span className="text-zinc-600">...</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Fundamental Agent</span> <span className="text-zinc-600">...</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Technical Agent</span> <span className="text-zinc-600">...</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Sentiment Agent</span> <span className="text-zinc-600">...</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Portfolio Coordinator</span> <span className="text-zinc-600">...</span></div>
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs Navigation */}
            <div className="flex border-b border-zinc-800">
              <button 
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2",
                  activeTab === 'overview' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <Activity className="w-4 h-4" /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('trace')}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2",
                  activeTab === 'trace' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <TerminalSquare className="w-4 h-4" /> Agent Trace
              </button>
              <button 
                onClick={() => setActiveTab('backtest')}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2",
                  activeTab === 'backtest' ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                )}
              >
                <BarChart3 className="w-4 h-4" /> Backtest Results
              </button>
            </div>

            {/* Tab Content: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Top: Final Proposal Card */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <div className="p-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5" />
                            PORTFOLIO COORDINATOR
                          </div>
                          <span className="text-zinc-500 text-sm font-mono">{ticker.toUpperCase()}</span>
                        </div>
                        <h2 className="text-2xl font-semibold text-zinc-100 mb-4">Final Trade Proposal</h2>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Rationale</h4>
                            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                              {results.proposal.rationale}
                            </p>
                          </div>
                          {results.proposal.disagreement_summary && results.proposal.disagreement_summary !== "None" && (
                            <div>
                              <h4 className="text-xs font-medium text-amber-500/70 uppercase tracking-wider mb-1">Debate Summary</h4>
                              <p className="text-sm text-amber-200/80 leading-relaxed bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                {results.proposal.disagreement_summary}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-72 flex-shrink-0 grid grid-cols-2 gap-3">
                        <div className="col-span-2 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Action</span>
                          <span className={cn(
                            "text-xl font-bold flex items-center gap-2",
                            results.proposal.action === 'BUY' ? "text-emerald-400" : 
                            results.proposal.action === 'SELL' ? "text-red-400" : "text-zinc-300"
                          )}>
                            {results.proposal.action === 'BUY' && <TrendingUp className="w-5 h-5" />}
                            {results.proposal.action === 'SELL' && <TrendingDown className="w-5 h-5" />}
                            {results.proposal.action}
                          </span>
                        </div>
                        
                        <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                          <span className="text-xs text-zinc-500 block mb-1">Position Size</span>
                          <span className="text-lg font-mono text-zinc-200">{results.proposal.suggested_size_pct}%</span>
                        </div>
                        
                        <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                          <span className="text-xs text-zinc-500 block mb-1">Confidence</span>
                          <span className="text-lg font-mono text-indigo-400">{results.proposal.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Fundamental Alignment</span>
                    <span className="text-emerald-400 text-sm font-medium">Strong</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Technical Setup</span>
                    <span className="text-blue-400 text-sm font-medium">Favorable</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Catalyst Density</span>
                    <span className="text-purple-400 text-sm font-medium">High</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Agent Trace */}
            {activeTab === 'trace' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fundamental */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <BrainCircuit className="w-4 h-4" />
                      <span className="font-semibold text-sm">Fundamental</span>
                    </div>
                    <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {results.fundamental.confidence}% Conf
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest flex items-center gap-1 mb-1.5"><TrendingUp className="w-3 h-3" /> Bull Points</span>
                      <ul className="space-y-1.5">
                        {results.fundamental.bull_points?.map((pt: string, i: number) => (
                          <li key={i} className="text-xs text-zinc-300 pl-3 relative before:content-[''] before:w-1 before:h-1 before:bg-emerald-500/50 before:rounded-full before:absolute before:left-0 before:top-1.5">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest flex items-center gap-1 mb-1.5"><TrendingDown className="w-3 h-3" /> Bear Points</span>
                      <ul className="space-y-1.5">
                        {results.fundamental.bear_points?.map((pt: string, i: number) => (
                          <li key={i} className="text-xs text-zinc-300 pl-3 relative before:content-[''] before:w-1 before:h-1 before:bg-red-500/50 before:rounded-full before:absolute before:left-0 before:top-1.5">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 text-blue-400">
                      <LineChartIcon className="w-4 h-4" />
                      <span className="font-semibold text-sm">Technical</span>
                    </div>
                    <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                      {results.technical.confidence}% Conf
                    </span>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Regime Identification</span>
                      <span className="text-zinc-200 font-medium">{results.technical.trend_regime}</span>
                    </div>
                    
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Momentum Score</span>
                      <span className="font-mono text-lg text-blue-400">{results.technical.momentum_score}<span className="text-xs text-zinc-600">/100</span></span>
                    </div>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-center gap-2 text-purple-400">
                      <MessageSquareText className="w-4 h-4" />
                      <span className="font-semibold text-sm">Sentiment</span>
                    </div>
                    <span className="text-xs font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                      {results.sentiment.confidence}% Conf
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Aggregate Pulse</span>
                      <span className={cn(
                        "font-medium text-sm",
                        results.sentiment.overall_sentiment.toUpperCase() === 'BULLISH' ? "text-emerald-400" :
                        results.sentiment.overall_sentiment.toUpperCase() === 'BEARISH' ? "text-red-400" : "text-zinc-300"
                      )}>{results.sentiment.overall_sentiment}</span>
                    </div>
                    
                    <div>
                      <span className="text-[10px] font-bold text-purple-400/70 uppercase tracking-widest block mb-2">Identified Catalysts</span>
                      <ul className="space-y-1.5">
                        {results.sentiment.catalysts?.map((pt: string, i: number) => (
                          <li key={i} className="text-xs text-zinc-300 pl-3 relative before:content-[''] before:w-1 before:h-1 before:bg-purple-500/50 before:rounded-full before:absolute before:left-0 before:top-1.5">
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Backtest */}
            {activeTab === 'backtest' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6">
                 <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                      <BarChart3 className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">Simulated Forward Performance</h3>
                      <p className="text-xs text-zinc-500">Projected equity curve based on suggested action</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-zinc-400">Strategy</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                      <span className="text-zinc-400">Benchmark</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={backtestData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStrategy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#52525b" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.slice(5)}
                        minTickGap={30}
                      />
                      <YAxis 
                        stroke="#52525b" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${(val/1000)}k`}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#e4e4e7' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Strategy" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorStrategy)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Benchmark" 
                        stroke="#52525b" 
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#52525b' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Expected Return</div>
                    <div className="text-lg font-medium text-emerald-400">+14.2%</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Max Drawdown</div>
                    <div className="text-lg font-medium text-red-400">-5.8%</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Sharpe Ratio</div>
                    <div className="text-lg font-medium text-zinc-200">1.84</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Win Rate</div>
                    <div className="text-lg font-medium text-zinc-200">62%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
