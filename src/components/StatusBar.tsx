import React from "react";

interface StatusBarProps {
  status?: string;
  bytecodeSize?: number;
  instructionCount?: number;
  selectedPC?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  status = "Ready",
  bytecodeSize,
  instructionCount,
  selectedPC,
}) => {
  return (
    <div className="h-7 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-600/50 text-xs text-gray-300 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-6">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-sm shadow-green-400/50"></span>
          <span className="text-green-300 font-medium">{status}</span>
        </span>
        
        {bytecodeSize !== undefined && (
          <span className="flex items-center bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
            <svg className="w-3 h-3 mr-1.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"/>
            </svg>
            <span className="text-blue-300 font-medium">{bytecodeSize} bytes</span>
          </span>
        )}
        
        {instructionCount !== undefined && (
          <span className="flex items-center bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
            <svg className="w-3 h-3 mr-1.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="text-purple-300 font-medium">{instructionCount} ops</span>
          </span>
        )}
        
        {selectedPC !== undefined && (
          <span className="flex items-center bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
            <svg className="w-3 h-3 mr-1.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
            </svg>
            <span className="text-yellow-300 font-medium">PC: 0x{selectedPC.toString(16).padStart(4, "0")}</span>
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-gray-400">
        <span className="flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">
            EVM Analysis Tool
          </span>
        </span>
        <span className="bg-gray-700/50 px-2 py-0.5 rounded text-xs font-mono border border-gray-600/30">
          v0.1.0
        </span>
      </div>
    </div>
  );
};

export default StatusBar;
