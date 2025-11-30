import { useState, useEffect, useRef, useCallback } from 'react';
import { BotConfig, BotState, LogEntry, StrategyType, ChartDataPoint, OpenOrder } from '../types';
import CryptoJS from 'crypto-js';

// Gate.io Constants
const WS_URL = "wss://fx-ws.gateio.ws/v4/ws/usdt";
const API_PREFIX = "/api/v4";
const HOST = "https://api.gateio.ws";

// Helper to sign requests for Gate.io V4 API
const signRequest = (secret: string, method: string, path: string, queryString: string, body: string) => {
  const t = Math.floor(Date.now() / 1000).toString();
  const hashedPayload = CryptoJS.SHA512(body || "").toString(CryptoJS.enc.Hex);
  const payload = [method, path, queryString, hashedPayload, t].join("\n");
  const sign = CryptoJS.HmacSHA512(payload, secret).toString(CryptoJS.enc.Hex);
  return { SIGN: sign, KEY: "", Timestamp: t };
};

// Helper to sign WS Auth messages
const signWsAuth = (secret: string) => {
  const t = Math.floor(Date.now() / 1000);
  const message = `channel=futures.balances&event=subscribe&time=${t}`;
  const sign = CryptoJS.HmacSHA512(message, secret).toString(CryptoJS.enc.Hex);
  return { method: "api_key", KEY: "", SIGN: sign, time: t };
};

export const useTradingBot = () => {
  const [config, setConfig] = useState<BotConfig>({
    apiKey: '',
    apiSecret: '',
    coinName: 'XRP',
    leverage: 20,
    initialQuantity: 1,
    strategy: StrategyType.AVELLANEDA,
    isSimulation: false,
    positionThreshold: 500,
    enableProfitTarget: false,
    profitTargetUSDT: 100,
    autoRestart: true,
    gridSpacing: 0.006,
    takeProfitSpacing: 0.004,
    gamma: 1.0,
    eta: 1.0,
    takerFee: 0.0005,
    sigma: 0.01,
    timeHorizon: 1,
  });

  const [state, setState] = useState<BotState>({
    isRunning: false,
    currentPrice: 0,
    longPosition: 0,
    shortPosition: 0,
    inventory: 0,
    balance: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    startTime: null,
    bestBid: 0,
    bestAsk: 0,
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Refs for access inside callbacks
  const stateRef = useRef(state);
  const configRef = useRef(config);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Real Trading State
  const openOrdersRef = useRef<OpenOrder[]>([]);
  const lastStrategyRunTimeRef = useRef<number>(0);
  const STRATEGY_THROTTLE = 10000; // 10s as per python bot

  // Mock State for Simulation
  const simOrdersRef = useRef<Array<any>>([]);
  
  // Profit Target Tracking
  const initialPnLRef = useRef<number>(0);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { configRef.current = config; }, [config]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'INFO') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    setLogs(prev => [entry, ...prev].slice(0, 500));
  }, []);

  // --- API INTERACTION (REAL) ---

  const gateApiCall = async (endpoint: string, method: string = 'GET', body: any = null, query: string = '') => {
    const { apiKey, apiSecret } = configRef.current;
    if (!apiKey || !apiSecret) throw new Error("API Key Missing");

    // 使用本地代理，而不是直接調用 Gate.io
    const url = `${API_PREFIX}${endpoint}${query ? '?' + query : ''}`;
    const bodyStr = body ? JSON.stringify(body) : "";
    
    const { SIGN, Timestamp } = signRequest(apiSecret, method, API_PREFIX + endpoint, query, bodyStr);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'KEY': apiKey,
          'SIGN': SIGN,
          'Timestamp': Timestamp,
        },
        body: body ? bodyStr : undefined,
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }
      return await response.json();
    } catch (e: any) {
      // CORS Error handling hint
      if (e.message.includes("Failed to fetch")) {
        addLog("CORS 錯誤: 瀏覽器阻止了直接 API 請求。請在支持 CORS 的環境中運行，或使用代理。", "ERROR");
      }
      throw e;
    }
  };

  const cancelAllOrders = async (side?: 'buy' | 'sell') => {
    if (configRef.current.isSimulation) {
      if (side) {
        simOrdersRef.current = simOrdersRef.current.filter(o => o.side !== side.toUpperCase());
      } else {
        simOrdersRef.current = [];
      }
      return;
    }

    try {
      // Gate.io allows cancelling by contract. 
      // For specific side cancellation, we iterate locally or use cancel_orders with side param if supported?
      // Gate v4 futures cancel_orders takes 'side' param? No, deletes all.
      // We will loop through openOrdersRef and cancel specific ones if side is provided.
      
      const symbol = `${configRef.current.coinName}_USDT`;
      if (!side) {
        await gateApiCall(`/futures/usdt/orders`, 'DELETE', null, `contract=${symbol}`);
        addLog("已撤銷所有掛單", "INFO");
      } else {
         // Manual filter cancel
         const ordersToCancel = openOrdersRef.current.filter(o => o.side === side);
         for (const order of ordersToCancel) {
            await gateApiCall(`/futures/usdt/orders/${order.id}`, 'DELETE');
         }
      }
    } catch (e: any) {
      addLog(`撤單失敗: ${e.message}`, "ERROR");
    }
  };

  const placeOrder = async (side: 'buy' | 'sell', price: number, size: number, reduceOnly: boolean) => {
    if (size <= 0) return;
    const { coinName } = configRef.current;
    
    // Formatting
    const priceStr = price.toFixed(4); // Assuming 4 decimals for simplicity, realistically need precision info
    
    if (configRef.current.isSimulation) {
      simOrdersRef.current.push({
         id: `sim_${Math.random()}`,
         side: side.toUpperCase(),
         price: price,
         quantity: size,
         isReduceOnly: reduceOnly,
         timestamp: Date.now()
      });
      addLog(`[模擬] 掛單: ${side.toUpperCase()} ${size}張 @ ${priceStr} (Reduce: ${reduceOnly})`, "INFO");
      return;
    }

    // Real API
    try {
      const payload = {
        contract: `${coinName}_USDT`,
        size: side === 'buy' ? size : -size, // Gate futures: positive for long/buy, negative for short/sell
        iceberg: 0,
        price: priceStr,
        tif: 'gtc',
        text: 't-web-bot',
        reduce_only: reduceOnly
      };
      
      await gateApiCall('/futures/usdt/orders', 'POST', payload);
      addLog(`[實盤] 掛單成功: ${side} ${size} @ ${priceStr}`, "SUCCESS");
    } catch (e: any) {
      addLog(`[實盤] 下單失敗: ${e.message}`, "ERROR");
    }
  };

  // --- STRATEGY ENGINE ---
  
  const runStrategy = async (price: number) => {
    // Throttle Strategy
    const now = Date.now();
    if (now - lastStrategyRunTimeRef.current < STRATEGY_THROTTLE) return;
    lastStrategyRunTimeRef.current = now;

    const c = configRef.current;
    const s = stateRef.current;
    
    let targetBid = 0;
    let targetAsk = 0;
    let r_price = 0;

    // 1. Calculate Targets
    if (c.strategy === StrategyType.AVELLANEDA) {
      const q = s.longPosition - s.shortPosition; // Net Inventory
      const { gamma, sigma, timeHorizon: T, eta } = c;

      // Avellaneda Logic (Simulating Python implementation)
      const variance = (sigma ** 2) * T;
      const alpha = gamma * variance * price; // inventory risk shift
      r_price = price - (q * alpha); // Reserve Price

      const spread_term = ((0.5 * gamma * variance) + (1 / gamma) * Math.log(1 + gamma / eta));
      const spread_half = Math.max(c.gridSpacing * price * 0.5, spread_term * price); 

      targetBid = r_price - spread_half;
      targetAsk = r_price + spread_half;
      
    } else {
      // GRID Strategy
      r_price = price;
      targetBid = price * (1 - c.gridSpacing);
      targetAsk = price * (1 + c.gridSpacing);
    }

    // Update UI Target State
    setState(prev => ({ ...prev, reservePrice: r_price, targetBid, targetAsk }));

    // 2. Execute Orders
    // Logic: If we have positions > threshold, we try to close (ReduceOnly)
    // Else we place Open orders.
    
    // NOTE: This is a simplified "Re-quote" logic. 
    // Real HFT would check existing orders, modify if close, or ignore if diff is small.
    // Here we cancel all (for specific side) and replace to keep it simple and robust like the python bot.

    // --- LONG SIDE ---
    if (s.longPosition > c.positionThreshold) {
       // Long too heavy -> Stop Buying, Place TP Sell
       // Check if we need to TP
       // For simplicity, we just ensure we have a TP order?
       // Python bot logic: "If pos > threshold, place reduce only sell at r_price * ratio"
       // We'll skip complex logic and just say: Stop buying.
       await cancelAllOrders('buy'); 
    } else {
       // Normal operation: Place Buy Limit
       // Only cancel/replace if price moved significantly? 
       // For this demo, we cancel previous opens on this side and place new
       await cancelAllOrders('buy');
       await placeOrder('buy', targetBid, c.initialQuantity, false);
    }

    // --- SHORT SIDE ---
    if (s.shortPosition > c.positionThreshold) {
       // Short too heavy -> Stop Selling
       await cancelAllOrders('sell');
    } else {
       await cancelAllOrders('sell');
       await placeOrder('sell', targetAsk, c.initialQuantity, false);
    }

    // --- TAKE PROFIT ORDERS ---
    // In Python bot, it places TPs separately.
    if (s.longPosition > 0) {
       const tpPrice = price * (1 + c.takeProfitSpacing);
       // We should check if we already have a TP order near this price
       // For simplicity, place fresh TP if none exists?
       // Or rely on the "cancelAll" logic? No, cancelAll clears TPs too.
       // So we re-place TPs every cycle.
       await placeOrder('sell', tpPrice, s.longPosition, true);
    }
    if (s.shortPosition > 0) {
       const tpPrice = price * (1 - c.takeProfitSpacing);
       await placeOrder('buy', tpPrice, s.shortPosition, true);
    }
  };

  // --- PROFIT TARGET MONITORING ---
  const checkProfitTarget = useCallback(async () => {
    const c = configRef.current;
    const s = stateRef.current;
    
    if (!c.enableProfitTarget || !s.isRunning) return;
    
    const currentTotalPnL = s.realizedPnL + s.unrealizedPnL;
    const profitSinceStart = currentTotalPnL - initialPnLRef.current;
    
    if (profitSinceStart >= c.profitTargetUSDT) {
      addLog(`🎯 達到盈利目標! 獲利: ${profitSinceStart.toFixed(2)} USDT (目標: ${c.profitTargetUSDT} USDT)`, 'SUCCESS');
      
      // 1. First cancel all pending orders
      addLog(`📋 正在撤銷所有掛單...`, 'INFO');
      await cancelAllOrders();
      
      // 2. Close all existing positions to lock in profits
      if (s.longPosition > 0) {
        addLog(`📈 平倉多頭倉位: ${s.longPosition} 張`, 'INFO');
        await placeOrder('sell', s.currentPrice, s.longPosition, true);
      }
      
      if (s.shortPosition > 0) {
        addLog(`📉 平倉空頭倉位: ${s.shortPosition} 張`, 'INFO');
        await placeOrder('buy', s.currentPrice, s.shortPosition, true);
      }
      
      addLog(`💰 所有倉位已平倉，浮盈已入袋！`, 'SUCCESS');
      
      // 3. Stop the bot
      if (wsRef.current) wsRef.current.close();
      setState(prev => ({ ...prev, isRunning: false }));
      
      if (c.autoRestart) {
        addLog(`⏰ 將在 10 秒後自動重啟策略...`, 'INFO');
        restartTimeoutRef.current = setTimeout(() => {
          addLog(`🔄 自動重啟策略`, 'INFO');
          startBot();
        }, 10000); // 延長到10秒確保平倉完成
      } else {
        addLog(`✋ 策略已停止，請手動重啟`, 'WARNING');
      }
    }
  }, []);


  // --- WEBSOCKET CONNECTION ---
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog('WebSocket 連接成功', 'SUCCESS');
      const time = Math.floor(Date.now() / 1000);
      const symbol = `${configRef.current.coinName}_USDT`;
      
      // 1. Subscribe Tickers (Public)
      ws.send(JSON.stringify({
        time,
        channel: 'futures.tickers',
        event: 'subscribe',
        payload: [symbol]
      }));

      // 2. Subscribe Private Channels (if Real Trading)
      if (!configRef.current.isSimulation && configRef.current.apiKey) {
         const { apiKey, apiSecret } = configRef.current;
         const auth = { ...signWsAuth(apiSecret), KEY: apiKey };
         
         // Orders
         ws.send(JSON.stringify({
             time, channel: 'futures.orders', event: 'subscribe', payload: [symbol], auth
         }));
         // Positions
         ws.send(JSON.stringify({
             time, channel: 'futures.positions', event: 'subscribe', payload: [symbol], auth
         }));
         // Balances
         ws.send(JSON.stringify({
             time, channel: 'futures.balances', event: 'subscribe', payload: ['USDT'], auth
         }));
         addLog('已發送私有頻道訂閱請求...', 'INFO');
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.event;
        const channel = data.channel;
        const result = data.result;

        if (eventType === 'update' && result) {
          
          // --- TICKER ---
          if (channel === 'futures.tickers') {
             const ticker = Array.isArray(result) ? result[0] : result;
             const price = parseFloat(ticker.last);
             
             if (!isNaN(price)) {
               setState(prev => ({ 
                 ...prev, 
                 currentPrice: price, 
                 bestBid: parseFloat(ticker.b),
                 bestAsk: parseFloat(ticker.a)
               }));

               // Chart Update
               setChartData(prev => {
                  const now = new Date();
                  const newPoint = { 
                      time: now.toLocaleTimeString(), 
                      price,
                      bid: stateRef.current.targetBid,
                      ask: stateRef.current.targetAsk,
                      reserve: stateRef.current.reservePrice
                  };
                  return [...prev.slice(-99), newPoint];
               });

               // Simulation Logic Hook
               if (stateRef.current.isRunning) {
                 if (configRef.current.isSimulation) {
                    processSimulationFills(price); // Sim fill logic
                 }
                 runStrategy(price); // Trigger Strategy
                 checkProfitTarget(); // Check profit target (async)
               }
             }
          }

          // --- ORDERS (Real) ---
          if (channel === 'futures.orders') {
             // result is array of orders
             const orders = Array.isArray(result) ? result : [result];
             orders.forEach((o: any) => {
                // Update local openOrdersRef
                // if status is open, add/update. if finished, remove.
                const isOpen = o.status === 'open';
                const id = o.id.toString();
                if (isOpen) {
                   const existingIdx = openOrdersRef.current.findIndex(x => x.id === id);
                   const newOrder: OpenOrder = {
                     id, 
                     price: parseFloat(o.price),
                     size: parseFloat(o.left), // 'left' is remaining size
                     side: o.size > 0 ? 'buy' : 'sell',
                     isReduceOnly: o.is_reduce_only
                   };
                   if (existingIdx >= 0) openOrdersRef.current[existingIdx] = newOrder;
                   else openOrdersRef.current.push(newOrder);
                } else {
                   // Finished/Cancelled
                   openOrdersRef.current = openOrdersRef.current.filter(x => x.id !== id);
                }
             });
          }

          // --- POSITIONS (Real) ---
          if (channel === 'futures.positions') {
             const positions = Array.isArray(result) ? result : [result];
             positions.forEach((p: any) => {
                if (p.contract === `${configRef.current.coinName}_USDT`) {
                   const size = parseFloat(p.size); // + is long, - is short usually, or check mode
                   // Gate futures v4: size is signed. + Long, - Short.
                   const long = size > 0 ? size : 0;
                   const short = size < 0 ? Math.abs(size) : 0;
                   
                   setState(prev => ({
                      ...prev,
                      longPosition: long,
                      shortPosition: short,
                      inventory: long - short,
                      unrealizedPnL: parseFloat(p.unrealised_pnl || 0)
                   }));
                }
             });
          }
          
          // --- BALANCES (Real) ---
           if (channel === 'futures.balances') {
             const balances = Array.isArray(result) ? result : [result];
             balances.forEach((b: any) => {
                if (b.currency === 'USDT') {
                   setState(prev => ({ ...prev, balance: parseFloat(b.balance) }));
                }
             });
           }
        }
      } catch (e) {
        // console.error(e);
      }
    };

    return ws;
  }, []);

  // --- SIMULATION FILLS (Legacy support for demo) ---
  const processSimulationFills = (currentPrice: number) => {
     const orders = simOrdersRef.current;
     let filled = false;
     let s = stateRef.current;
     
     const remaining = orders.filter(o => {
        let isFilled = false;
        if (o.side === 'BUY' && currentPrice <= o.price) {
           isFilled = true;
           if (o.isReduceOnly) {
              s.shortPosition = Math.max(0, s.shortPosition - o.quantity);
              addLog(`[模擬成交] 買入平空 ${o.quantity} @ ${o.price}`, "SUCCESS");
           } else {
              s.longPosition += o.quantity;
              addLog(`[模擬成交] 買入開多 ${o.quantity} @ ${o.price}`, "SUCCESS");
           }
        } else if (o.side === 'SELL' && currentPrice >= o.price) {
           isFilled = true;
           if (o.isReduceOnly) {
              s.longPosition = Math.max(0, s.longPosition - o.quantity);
              addLog(`[模擬成交] 賣出平多 ${o.quantity} @ ${o.price}`, "SUCCESS");
           } else {
              s.shortPosition += o.quantity;
              addLog(`[模擬成交] 賣出開空 ${o.quantity} @ ${o.price}`, "SUCCESS");
           }
        }
        if (isFilled) filled = true;
        return !isFilled;
     });

     if (filled) {
        simOrdersRef.current = remaining;
        setState(prev => ({
           ...prev,
           longPosition: s.longPosition,
           shortPosition: s.shortPosition,
           inventory: s.longPosition - s.shortPosition
        }));
     }
  };

  const startBot = () => {
    if (!config.isSimulation && (!config.apiKey || !config.apiSecret)) {
      addLog('實盤模式需要輸入 API Key 和 Secret', 'ERROR');
      return;
    }
    
    // Clear any existing restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Record initial PnL for profit target calculation
    initialPnLRef.current = state.realizedPnL + state.unrealizedPnL;
    
    addLog(`啟動策略: ${config.strategy} [${config.isSimulation ? '模擬' : '實盤'}] | ${config.coinName}`, 'SUCCESS');
    if (config.enableProfitTarget) {
      addLog(`💰 盈利目標: ${config.profitTargetUSDT} USDT | 自動重啟: ${config.autoRestart ? '是' : '否'}`, 'INFO');
    }
    setState(prev => ({ ...prev, isRunning: true, startTime: Date.now() }));
    connectWebSocket();
  };

  const stopBot = () => {
    // Clear any existing restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (wsRef.current) wsRef.current.close();
    setState(prev => ({ ...prev, isRunning: false }));
    addLog('策略已停止', 'WARNING');
  };

  useEffect(() => {
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, []);

  return {
    config,
    setConfig,
    state,
    logs,
    chartData,
    startBot,
    stopBot,
  };
};
