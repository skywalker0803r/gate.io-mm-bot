export enum StrategyType {
  GRID = 'GRID',
  AVELLANEDA = 'AVELLANEDA',
}

export interface BotConfig {
  apiKey: string;
  apiSecret: string;
  coinName: string;
  leverage: number;
  initialQuantity: number;
  strategy: StrategyType;
  isSimulation: boolean; // Toggle for Real vs Paper
  
  // Risk Management
  positionThreshold: number; // 500
  
  // Profit Target Settings
  enableProfitTarget: boolean; // 是否啟用盈利目標
  profitTargetUSDT: number; // 盈利目標 USDT
  autoRestart: boolean; // 達到目標後是否自動重啟
  
  // Grid Specific
  gridSpacing: number; // 0.006 (0.6%)
  takeProfitSpacing: number; // 0.004 (0.4%)
  
  // Avellaneda Specific
  gamma: number; // Risk aversion (1.0)
  eta: number;   // Inventory risk (auto or manual)
  takerFee: number; // 0.0005
  sigma: number; // Volatility (auto or manual)
  timeHorizon: number; // T_end (1 hour)
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  message: string;
}

export interface OpenOrder {
  id: string;
  price: number;
  size: number; // remaining size
  side: 'buy' | 'sell';
  isReduceOnly: boolean;
}

export interface BotState {
  isRunning: boolean;
  currentPrice: number;
  
  // Positions
  longPosition: number;
  shortPosition: number;
  inventory: number; // Net position
  
  // Account
  balance: number;
  realizedPnL: number;
  unrealizedPnL: number;
  startTime: number | null;
  
  // Live Data
  bestBid: number;
  bestAsk: number;
  
  // Strategy Internal State
  reservePrice?: number;
  targetBid?: number;
  targetAsk?: number;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  bid?: number;
  ask?: number;
  reserve?: number;
}