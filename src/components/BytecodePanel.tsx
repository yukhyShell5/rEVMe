import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface BytecodeData {
  filename: string;
  bytecode: string;
  size: number;
}

export const BytecodePanel: React.FC = () => {
  const [bytecodeData, setBytecodeData] = useState<BytecodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await invoke<BytecodeData | null>("open_bin_file");
      
      if (result) {
        setBytecodeData(result);
      }
    } catch (err) {
      setError(err as string);
      console.error("Failed to open file:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-4 text-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide muted">Bytecode</h2>
        <button
          onClick={handleOpenFile}
          disabled={loading}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {loading ? "Loading..." : "Open .bin File"}
        </button>
      </div>
      
      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-700/50 rounded text-red-200 text-xs">
          Error: {error}
        </div>
      )}
      
      {bytecodeData && (
        <div className="mb-2 text-xs text-muted">
          <strong>File:</strong> {bytecodeData.filename} ({bytecodeData.size} bytes)
        </div>
      )}
      
      <div className="card p-3 flex-1 overflow-hidden">
        <pre className="text-xs h-full overflow-auto font-mono leading-tight">
          {bytecodeData ? bytecodeData.bytecode : `// Click "Open .bin File" to load bytecode
// Supported format: .bin files
//
// Example display format:
// 0x0000: 6060 4052 3415 6100  0f57 6000 8035 0315  |..@R4.a..W...5..|
// 0x0010: 6001 5760 0135 0481  6080 5260 0060 0033  |..W..5....R...3|
// 0x0020: 5af4 1561 001e 5760  0080 fd5b 6000 5260  |Z..a..W...[..R.|`}
        </pre>
      </div>
    </div>
  );
};

export default BytecodePanel;
