import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';

interface Props {
  data: ChartDataPoint[];
}

const RealtimeChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm border border-dashed border-dark-800 rounded-lg">
        等待 WebSocket 數據...
      </div>
    );
  }

  // Calculate dynamic domain
  const prices = data.map(d => d.price);
  // Filter out zero prices if initialization lags
  const validPrices = prices.filter(p => p > 0);
  
  if (validPrices.length === 0) return null;

  const min = Math.min(...validPrices) * 0.9995;
  const max = Math.max(...validPrices) * 1.0005;

  return (
    <div className="h-64 w-full bg-dark-950/50 rounded-lg border border-dark-800/50 p-2 relative">
      <div className="absolute top-2 right-2 z-10 flex gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-green-400"><div className="w-2 h-0.5 bg-green-400"/> Bid</span>
          <span className="flex items-center gap-1 text-red-400"><div className="w-2 h-0.5 bg-red-400"/> Ask</span>
          <span className="flex items-center gap-1 text-indigo-400"><div className="w-2 h-0.5 bg-indigo-400"/> Reserve</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            tick={{fontSize: 9}}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis 
            domain={[min, max]} 
            stroke="#64748b" 
            tick={{fontSize: 9}} 
            width={55}
            tickFormatter={(value) => value.toFixed(4)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
            itemStyle={{ padding: 0 }}
            formatter={(value: number) => [value?.toFixed(5), '']}
            labelStyle={{ marginBottom: '0.25rem', color: '#94a3b8' }}
          />
          
          {/* Main Price Line */}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
            name="Market"
          />

          {/* Strategy Bands */}
          <Line 
            type="step" 
            dataKey="bid" 
            stroke="#22c55e" 
            strokeWidth={1} 
            strokeDasharray="3 3" 
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="step" 
            dataKey="ask" 
            stroke="#ef4444" 
            strokeWidth={1} 
            strokeDasharray="3 3" 
            dot={false}
            isAnimationActive={false}
          />
          <Line 
            type="monotone" 
            dataKey="reserve" 
            stroke="#6366f1" 
            strokeWidth={1} 
            dot={false} 
            opacity={0.6}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealtimeChart;
