import React from 'react';
import { useTradingBot } from './hooks/useTradingBot';
import ConfigForm from './components/ConfigForm';
import LogConsole from './components/LogConsole';
import RealtimeChart from './components/RealtimeChart';
import { Activity, Play, Square, TrendingUp, Wallet, ArrowUp, ArrowDown } from 'lucide-react';

export default function App() {
  const { 
    config, 
    setConfig, 
    state, 
    logs, 
    chartData, 
    startBot, 
    stopBot 
  } = useTradingBot();

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-gate-500/30">
      
      {/* Header */}
      <header className="bg-dark-900/80 backdrop-blur-md border-b border-dark-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-gate-500 to-gate-600 flex items-center justify-center shadow-lg shadow-gate-500/20">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Gate.io <span className="text-gate-500">MM Bot</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${state.isRunning ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${state.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                {state.isRunning ? 'RUNNING' : 'STOPPED'}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Config (4 cols) - Sticky */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
            <ConfigForm 
              config={config} 
              onChange={setConfig} 
              isRunning={state.isRunning} 
            />
            
            {/* Control Panel */}
            <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 shadow-xl">
               <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">操作控制</h3>
               {state.isRunning ? (
                 <button 
                   onClick={stopBot}
                   className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-red-900/20"
                 >
                   <Square className="w-5 h-5 fill-current" />
                   停止策略 (STOP)
                 </button>
               ) : (
                 <button 
                   onClick={startBot}
                   className="w-full flex items-center justify-center gap-2 bg-gate-600 hover:bg-gate-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-gate-900/20"
                 >
                   <Play className="w-5 h-5 fill-current" />
                   啟動策略 (START)
                 </button>
               )}
               <p className="text-[10px] text-gray-500 mt-3 text-center">
                 警告：這是一個高頻交易策略模擬器。請確保您了解 Avellaneda 模型原理。
               </p>
            </div>
          </div>

          {/* Right Column: Dashboard (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl">
                <div className="text-gray-500 text-xs mb-1">最新價格 (USDT)</div>
                <div className="text-2xl font-mono text-white">{state.currentPrice.toFixed(4)}</div>
              </div>
              <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl">
                <div className="text-gray-500 text-xs mb-1">庫存 (Inventory)</div>
                <div className={`text-2xl font-mono ${state.inventory > 0 ? 'text-green-400' : state.inventory < 0 ? 'text-red-400' : 'text-white'}`}>
                  {state.inventory}
                </div>
              </div>
              <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl">
                <div className="text-gray-500 text-xs mb-1">多頭持倉 (Long)</div>
                <div className="flex items-center gap-2">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-xl font-mono text-white">{state.longPosition}</span>
                </div>
              </div>
              <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl">
                <div className="text-gray-500 text-xs mb-1">空頭持倉 (Short)</div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-red-500" />
                  <span className="text-xl font-mono text-white">{state.shortPosition}</span>
                </div>
              </div>
            </div>

            {/* Chart Area */}
            <div className="bg-dark-900 border border-dark-800 p-4 rounded-xl shadow-xl flex-1 min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                   <Activity className="w-4 h-4 text-gate-500" />
                   實時監控 (Real-time Monitor)
                 </h3>
                 <div className="flex gap-4 text-xs font-mono">
                    <span className="text-green-400">Bid: {state.targetBid?.toFixed(4) || '--'}</span>
                    <span className="text-indigo-400">Res: {state.reservePrice?.toFixed(4) || '--'}</span>
                    <span className="text-red-400">Ask: {state.targetAsk?.toFixed(4) || '--'}</span>
                 </div>
              </div>
              <RealtimeChart data={chartData} />
            </div>

            {/* Console Log */}
            <div className="h-64">
              <LogConsole logs={logs} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}