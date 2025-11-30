import React from 'react';
import { BotConfig, StrategyType } from '../types';
import { Settings, Cpu, ShieldAlert, Zap, BookOpen } from 'lucide-react';

interface Props {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
  isRunning: boolean;
}

const ConfigForm: React.FC<Props> = ({ config, onChange, isRunning }) => {
  
  const handleChange = (key: keyof BotConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 shadow-xl max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin">
      <div className="flex items-center gap-2 mb-6 border-b border-dark-800 pb-4 sticky top-0 bg-dark-900 z-10">
        <Settings className="w-5 h-5 text-gate-500" />
        <h2 className="text-xl font-bold text-white">Bot 配置</h2>
      </div>

      <div className="space-y-6">
        
        {/* Mode Switch */}
        <div className="bg-dark-950/50 rounded-lg p-2 flex gap-2">
            <button
                disabled={isRunning}
                onClick={() => handleChange('isSimulation', false)}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${!config.isSimulation ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:bg-dark-800'}`}
            >
                <Zap className="w-3 h-3" />
                實盤交易 (Real)
            </button>
            <button
                disabled={isRunning}
                onClick={() => handleChange('isSimulation', true)}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${config.isSimulation ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-500 hover:bg-dark-800'}`}
            >
                <BookOpen className="w-3 h-3" />
                模擬測試 (Paper)
            </button>
        </div>

        {/* API Credentials */}
        <div className={`space-y-3 transition-opacity ${config.isSimulation ? 'opacity-50 grayscale' : 'opacity-100'}`}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
              API 設置
              {config.isSimulation && <span className="text-[10px] text-green-400">模擬模式無需 API Key</span>}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="password"
                disabled={isRunning}
                value={config.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-gate-500 outline-none placeholder-gray-700"
                placeholder="Gate.io API Key (v4)"
              />
              <input
                type="password"
                disabled={isRunning}
                value={config.apiSecret}
                onChange={(e) => handleChange('apiSecret', e.target.value)}
                className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-gate-500 outline-none placeholder-gray-700"
                placeholder="Gate.io API Secret (v4)"
              />
            </div>
            {!config.isSimulation && (
                <p className="text-[10px] text-red-400/80">
                   * 注意: 瀏覽器直接連接交易所可能會遇到 CORS 限制。建議在本地環境或 Electron 中運行。
                </p>
            )}
        </div>

        {/* Basic Settings */}
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">基礎參數</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">幣種 (Coin)</label>
                <input
                  type="text"
                  disabled={isRunning}
                  value={config.coinName}
                  onChange={(e) => handleChange('coinName', e.target.value.toUpperCase())}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  placeholder="XRP"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">槓桿 (Leverage)</label>
                <input
                  type="number"
                  disabled={isRunning}
                  value={config.leverage}
                  onChange={(e) => handleChange('leverage', parseFloat(e.target.value))}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">單次張數 (Qty)</label>
                <input
                  type="number"
                  disabled={isRunning}
                  value={config.initialQuantity}
                  onChange={(e) => handleChange('initialQuantity', parseFloat(e.target.value))}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
               <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">持倉上限 (Max Pos)</label>
                <input
                  type="number"
                  disabled={isRunning}
                  value={config.positionThreshold}
                  onChange={(e) => handleChange('positionThreshold', parseFloat(e.target.value))}
                  className="w-full bg-dark-950 border border-dark-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">策略選擇</h3>
           <div className="grid grid-cols-2 gap-2">
             <button
               disabled={isRunning}
               onClick={() => handleChange('strategy', StrategyType.GRID)}
               className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                 config.strategy === StrategyType.GRID 
                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                 : 'bg-dark-800 text-gray-400 hover:bg-dark-800/80'
               }`}
             >
               <Cpu className="w-3 h-3" />
               傳統網格 (bot.py)
             </button>
             <button
               disabled={isRunning}
               onClick={() => handleChange('strategy', StrategyType.AVELLANEDA)}
               className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                 config.strategy === StrategyType.AVELLANEDA 
                 ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
                 : 'bg-dark-800 text-gray-400 hover:bg-dark-800/80'
               }`}
             >
               <ShieldAlert className="w-3 h-3" />
               Avellaneda
             </button>
           </div>
        </div>

        {/* Strategy Specific Params */}
        {config.strategy === StrategyType.AVELLANEDA ? (
          <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
             <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider">Avellaneda 核心參數</h3>
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Gamma (風險厭惡)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isRunning}
                    value={config.gamma}
                    onChange={(e) => handleChange('gamma', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Eta (庫存衰減)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isRunning}
                    value={config.eta}
                    onChange={(e) => handleChange('eta', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Sigma (波動率)</label>
                  <input
                    type="number"
                    step="0.001"
                    disabled={isRunning}
                    value={config.sigma}
                    onChange={(e) => handleChange('sigma', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">T_End (時間窗口)</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={isRunning}
                    value={config.timeHorizon}
                    onChange={(e) => handleChange('timeHorizon', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] text-gray-400 mb-1">Taker Fee (費率)</label>
                  <input
                    type="number"
                    step="0.0001"
                    disabled={isRunning}
                    value={config.takerFee}
                    onChange={(e) => handleChange('takerFee', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
             </div>
          </div>
        ) : (
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
             <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider">網格參數</h3>
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] text-gray-400 mb-1">網格間距 (Spacing)</label>
                  <input
                    type="number"
                    step="0.001"
                    disabled={isRunning}
                    value={config.gridSpacing}
                    onChange={(e) => handleChange('gridSpacing', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
               <div>
                  <label className="block text-[10px] text-gray-400 mb-1">止盈間距 (Take Profit)</label>
                  <input
                    type="number"
                    step="0.001"
                    disabled={isRunning}
                    value={config.takeProfitSpacing}
                    onChange={(e) => handleChange('takeProfitSpacing', parseFloat(e.target.value))}
                    className="w-full bg-dark-950 border border-dark-800 rounded px-2 py-1 text-sm text-white"
                  />
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigForm;