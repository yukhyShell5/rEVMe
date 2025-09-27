import React, { useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";

interface OpcodeInstruction {
  pc: number;
  opcode: string;
  args: string[];
  gas: number;
  stack_before: string[];
  stack_after: string[];
}

interface SortConfig {
  key: keyof OpcodeInstruction | null;
  direction: 'asc' | 'desc';
}

export const OpcodesPanel: React.FC = () => {
  const [instructions, setInstructions] = useState<OpcodeInstruction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [bytecode, setBytecode] = useState("");

  const handleLoadBytecode = async () => {
    if (!bytecode.trim()) {
      setError("Please enter bytecode");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await invoke<OpcodeInstruction[]>("disassemble_bytecode", { 
        bytecodeHex: bytecode.trim() 
      });
      
      setInstructions(result);
    } catch (err) {
      setError(err as string);
      console.error("Failed to disassemble bytecode:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedInstructions = useMemo(() => {
    let filtered = instructions.filter(instruction => 
      instruction.opcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.pc.toString().includes(searchTerm) ||
      instruction.args.some(arg => arg.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (Array.isArray(aValue) || Array.isArray(bValue)) {
          const aStr = Array.isArray(aValue) ? aValue.join(',') : String(aValue);
          const bStr = Array.isArray(bValue) ? bValue.join(',') : String(bValue);
          return sortConfig.direction === 'asc' 
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [instructions, searchTerm, sortConfig]);

  const handleSort = (key: keyof OpcodeInstruction) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof OpcodeInstruction) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const formatArray = (arr: string[]) => {
    if (arr.length === 0) return '-';
    if (arr.length <= 3) return arr.join(', ');
    return `${arr.slice(0, 3).join(', ')}... (+${arr.length - 3})`;
  };

  return (
    <div className="w-full h-full p-4 text-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide muted">Opcodes</h2>
      </div>
      
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={bytecode}
            onChange={(e) => setBytecode(e.target.value)}
            placeholder="Enter EVM bytecode (hex)..."
            className="flex-1 px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleLoadBytecode}
            disabled={loading}
            className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded transition-colors"
          >
            {loading ? "Loading..." : "Disassemble"}
          </button>
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search opcodes..."
          className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-700/50 rounded text-red-200 text-xs">
          Error: {error}
        </div>
      )}
      
      <div className="card flex-1 overflow-hidden">
        {instructions.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
                <tr>
                  <th 
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 select-none"
                    onClick={() => handleSort('pc')}
                  >
                    PC {getSortIcon('pc')}
                  </th>
                  <th 
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 select-none"
                    onClick={() => handleSort('opcode')}
                  >
                    Opcode {getSortIcon('opcode')}
                  </th>
                  <th className="p-2 text-left">Args</th>
                  <th 
                    className="p-2 text-left cursor-pointer hover:bg-gray-700 select-none"
                    onClick={() => handleSort('gas')}
                  >
                    Gas {getSortIcon('gas')}
                  </th>
                  <th className="p-2 text-left">Stack Before</th>
                  <th className="p-2 text-left">Stack After</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedInstructions.map((instruction, index) => (
                  <tr 
                    key={index}
                    className={`border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer ${
                      highlightedRow === index ? 'bg-blue-900/30' : ''
                    }`}
                    onClick={() => setHighlightedRow(highlightedRow === index ? null : index)}
                  >
                    <td className="p-2 font-mono">0x{instruction.pc.toString(16).padStart(4, '0')}</td>
                    <td className="p-2 font-bold text-blue-300">{instruction.opcode}</td>
                    <td className="p-2 font-mono text-green-300">
                      {instruction.args.length > 0 ? instruction.args.join(', ') : '-'}
                    </td>
                    <td className="p-2 text-yellow-300">{instruction.gas}</td>
                    <td className="p-2 text-gray-400 font-mono text-xs">
                      {formatArray(instruction.stack_before)}
                    </td>
                    <td className="p-2 text-gray-400 font-mono text-xs">
                      {formatArray(instruction.stack_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="mb-2">📋</div>
              <div>Enter bytecode and click "Disassemble" to view opcodes</div>
              <div className="text-xs mt-1">Example: 0x6060604052341561000f57...</div>
            </div>
          </div>
        )}
      </div>
      
      {instructions.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Showing {filteredAndSortedInstructions.length} of {instructions.length} instructions
          {highlightedRow !== null && (
            <span className="ml-4 text-blue-400">
              Selected: instruction at PC 0x{instructions[highlightedRow]?.pc.toString(16).padStart(4, '0')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OpcodesPanel;
