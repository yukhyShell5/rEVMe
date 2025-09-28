import React, { useState, useMemo } from "react";
import { useAppStore } from "../hooks/useAppStore";

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

const OpcodesPanel: React.FC = () => {
  const { state } = useAppStore();
  const { opcodeInstructions, bytecodeData, loading, error } = state;
  
  // Debug logging
  React.useEffect(() => {
    console.log("🔧 OpcodesPanel - MOUNTED with store");
    console.log("🔧 OpcodesPanel - Initial state:", { opcodeInstructions: opcodeInstructions?.length || 0, bytecodeData, loading, error });
  }, []);

  React.useEffect(() => {
    console.log("🔧 OpcodesPanel - opcodeInstructions changed:", opcodeInstructions?.length || 0, "instructions");
  }, [opcodeInstructions]);

  React.useEffect(() => {
    console.log("📄 OpcodesPanel - bytecodeData changed:", bytecodeData?.filename);
  }, [bytecodeData]);
  
  const [selectedOpcode, setSelectedOpcode] = useState<OpcodeInstruction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const filteredAndSortedOpcodes = useMemo(() => {
    if (!opcodeInstructions) return [];
    
    let filtered = opcodeInstructions.filter(instruction =>
      instruction.opcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.pc.toString().includes(searchTerm) ||
      instruction.args.some(arg => arg.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [opcodeInstructions, searchTerm, sortConfig]);

  const handleSort = (key: keyof OpcodeInstruction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof OpcodeInstruction) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  return (
    <div className="w-full h-full p-4 text-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide muted">Opcodes</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search opcodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-muted">
            {filteredAndSortedOpcodes.length} instructions
          </span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4 text-muted">
          Loading opcodes...
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-700/50 rounded text-red-200 text-xs">
          Error: {error}
        </div>
      )}

      {bytecodeData && (
        <div className="mb-2 text-xs text-muted">
          Disassembly for: <strong>{bytecodeData.filename}</strong>
        </div>
      )}

      <div className="flex-1 flex gap-3">
        <div className="flex-1 card p-0 overflow-hidden">
          {filteredAndSortedOpcodes.length > 0 ? (
            <div className="h-full overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-800 sticky top-0">
                  <tr className="text-left">
                    <th 
                      className="p-2 cursor-pointer hover:bg-gray-700 select-none"
                      onClick={() => handleSort('pc')}
                    >
                      PC {getSortIcon('pc')}
                    </th>
                    <th 
                      className="p-2 cursor-pointer hover:bg-gray-700 select-none"
                      onClick={() => handleSort('opcode')}
                    >
                      Opcode {getSortIcon('opcode')}
                    </th>
                    <th className="p-2">Args</th>
                    <th 
                      className="p-2 cursor-pointer hover:bg-gray-700 select-none"
                      onClick={() => handleSort('gas')}
                    >
                      Gas {getSortIcon('gas')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedOpcodes.map((instruction, index) => (
                    <tr 
                      key={`${instruction.pc}-${index}`}
                      className={`hover:bg-gray-800 cursor-pointer border-b border-gray-800 ${
                        selectedOpcode?.pc === instruction.pc ? 'bg-blue-900/30' : ''
                      }`}
                      onClick={() => setSelectedOpcode(instruction)}
                    >
                      <td className="p-2 font-mono">0x{instruction.pc.toString(16).padStart(4, '0')}</td>
                      <td className="p-2 font-mono font-bold text-blue-300">{instruction.opcode}</td>
                      <td className="p-2 font-mono text-green-300">
                        {instruction.args.length > 0 ? instruction.args.join(', ') : '-'}
                      </td>
                      <td className="p-2 font-mono text-yellow-300">{instruction.gas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted">
              {opcodeInstructions.length === 0 
                ? "No bytecode loaded. Open a .bin file or use the menu to load bytecode."
                : "No opcodes match your search criteria."
              }
            </div>
          )}
        </div>

        {selectedOpcode && (
          <div className="w-80 card p-3 flex-shrink-0">
            <h3 className="text-sm font-semibold mb-3 text-blue-300">
              {selectedOpcode.opcode} Details
            </h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted">Program Counter:</span>
                <div className="font-mono mt-1">0x{selectedOpcode.pc.toString(16).padStart(4, '0')} ({selectedOpcode.pc})</div>
              </div>
              
              <div>
                <span className="text-muted">Gas Cost:</span>
                <div className="font-mono mt-1 text-yellow-300">{selectedOpcode.gas}</div>
              </div>
              
              {selectedOpcode.args.length > 0 && (
                <div>
                  <span className="text-muted">Arguments:</span>
                  <div className="font-mono mt-1 text-green-300">
                    {selectedOpcode.args.map((arg, i) => (
                      <div key={i}>{arg}</div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-muted">Stack Before:</span>
                <div className="font-mono mt-1 max-h-24 overflow-auto">
                  {selectedOpcode.stack_before.length > 0 ? (
                    selectedOpcode.stack_before.map((item, i) => (
                      <div key={i} className="text-purple-300">[{i}] {item}</div>
                    ))
                  ) : (
                    <div className="text-gray-500">Empty</div>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-muted">Stack After:</span>
                <div className="font-mono mt-1 max-h-24 overflow-auto">
                  {selectedOpcode.stack_after.length > 0 ? (
                    selectedOpcode.stack_after.map((item, i) => (
                      <div key={i} className="text-purple-300">[{i}] {item}</div>
                    ))
                  ) : (
                    <div className="text-gray-500">Empty</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpcodesPanel;
