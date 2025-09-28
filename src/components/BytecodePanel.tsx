import React from "react";
import { useAppStore } from "../hooks/useAppStore";

const BytecodePanel: React.FC = () => {
  const { state, loadBytecodeFile } = useAppStore();
  const { bytecodeData, loading, error } = state;

  // Debug logging
  React.useEffect(() => {
    console.log("📄 BytecodePanel - MOUNTED with store");
    console.log("📄 BytecodePanel - Initial state:", { bytecodeData, loading, error });
  }, []);

  React.useEffect(() => {
    console.log("📄 BytecodePanel - bytecodeData changed:", bytecodeData);
  }, [bytecodeData]);

  React.useEffect(() => {
    console.log("⏳ BytecodePanel - loading changed:", loading);
  }, [loading]);

  React.useEffect(() => {
    console.log("❌ BytecodePanel - error changed:", error);
  }, [error]);

  const handleLoadFromHex = () => {
    const hex = prompt("Enter bytecode as hex (0x prefix optional):");
    if (hex?.trim()) {
      const cleanHex = hex.startsWith('0x') ? hex : '0x' + hex;
      // For now, just log - we'll implement hex loading later
      console.log("Loading hex:", cleanHex);
    }
  };

  return (
    <div className="w-full h-full p-4 text-sm flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide muted">Bytecode</h2>
        <div className="flex gap-2">
          <button
            onClick={loadBytecodeFile}
            disabled={loading}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            {loading ? "Loading..." : "Open .bin File"}
          </button>
          <button
            onClick={handleLoadFromHex}
            disabled={loading}
            className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            Load Hex
          </button>
        </div>
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
