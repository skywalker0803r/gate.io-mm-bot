import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface Props {
  logs: LogEntry[];
}

const LogConsole: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-400';
      case 'WARNING': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      default: return 'text-blue-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border border-dark-800 rounded-xl overflow-hidden shadow-xl">
      <div className="flex items-center gap-2 px-4 py-3 bg-dark-950 border-b border-dark-800">
        <Terminal className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">系統日誌 (System Logs)</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 scrollbar-thin bg-black/40">
        {logs.length === 0 && (
            <div className="text-gray-600 italic">尚未啟動策略...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-white/5 p-0.5 rounded transition-colors">
            <span className="text-gray-500 whitespace-nowrap">[{log.timestamp}]</span>
            <span className={`font-bold ${getLevelColor(log.level)} whitespace-nowrap w-16`}>
              {log.level}
            </span>
            <span className="text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogConsole;