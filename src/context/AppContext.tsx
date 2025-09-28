import React, { createContext, useContext, useState, useCallback } from "react";

interface BytecodeData {
  filename: string;
  bytecode: string;
  size: number;
}

interface OpcodeInstruction {
  pc: number;
  opcode: string;
  args: string[];
  gas: number;
  stack_before: string[];
  stack_after: string[];
}

interface CFGData {
  nodes: any[];
  edges: any[];
}

interface AppState {
  bytecodeData: BytecodeData | null;
  opcodeInstructions: OpcodeInstruction[];
  cfgData: CFGData | null;
  loading: boolean;
  error: string | null;
}

interface AppContextType {
  state: AppState;
  loadBytecodeFile: () => Promise<void>;
  loadBytecodeHex: (hex: string) => Promise<void>;
  clearData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    bytecodeData: null,
    opcodeInstructions: [],
    cfgData: null,
    loading: false,
    error: null,
  });

  const loadBytecodeFile = useCallback(async () => {
    try {
      console.log("🚀 Starting loadBytecodeFile...");
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { invoke } = await import("@tauri-apps/api/core");
      console.log("📁 Opening file dialog...");
      const bytecodeResult = await invoke<BytecodeData | null>("open_bin_file");
      
      if (!bytecodeResult) {
        console.log("❌ No file selected or file opening failed");
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log("✅ File opened:", bytecodeResult.filename, `(${bytecodeResult.size} bytes)`);
      console.log("📄 Bytecode preview:", bytecodeResult.bytecode.substring(0, 200));

      // Extract hex from bytecode display format
      const hexData = extractHexFromBytecode(bytecodeResult.bytecode);
      console.log("🔍 Extracted hex data:", hexData.substring(0, 100) + "...");
      
      if (!hexData || hexData === '0x') {
        console.error("⚠️ Failed to extract hex data from bytecode");
        setState(prev => ({
          ...prev,
          loading: false,
          error: "Failed to extract hex data from bytecode",
        }));
        return;
      }

      // Load opcodes
      console.log("🔧 Disassembling bytecode...");
      const opcodeResult = await invoke<OpcodeInstruction[]>("disassemble_bytecode", {
        bytecodeHex: hexData
      });
      console.log("✅ Opcodes loaded:", opcodeResult.length, "instructions");
      
      // Load CFG
      console.log("📊 Generating CFG...");
      const cfgResult = await invoke<CFGData>("generate_cfg", {
        bytecodeHex: hexData
      });
      console.log("✅ CFG generated:", cfgResult.nodes.length, "nodes,", cfgResult.edges.length, "edges");

      setState(prev => ({
        ...prev,
        bytecodeData: bytecodeResult,
        opcodeInstructions: opcodeResult,
        cfgData: cfgResult,
        loading: false,
        error: null,
      }));
      
      console.log("🎉 All data loaded successfully!");
    } catch (err) {
      console.error("💥 Error in loadBytecodeFile:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err as string,
      }));
      console.error("Failed to load bytecode file:", err);
    }
  }, []);

  const loadBytecodeHex = useCallback(async (hex: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { invoke } = await import("@tauri-apps/api/core");
      
      // Create bytecode data from hex
      const bytecodeData: BytecodeData = {
        filename: "manual_input.hex",
        bytecode: formatHexAsBytecode(hex),
        size: hex.replace(/0x/g, "").replace(/\s/g, "").length / 2,
      };
      
      // Load opcodes
      const opcodeResult = await invoke<OpcodeInstruction[]>("disassemble_bytecode", {
        bytecodeHex: hex
      });
      
      // Load CFG
      const cfgResult = await invoke<CFGData>("generate_cfg", {
        bytecodeHex: hex
      });

      setState(prev => ({
        ...prev,
        bytecodeData,
        opcodeInstructions: opcodeResult,
        cfgData: cfgResult,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err as string,
      }));
      console.error("Failed to load bytecode hex:", err);
    }
  }, []);

  const clearData = useCallback(() => {
    setState({
      bytecodeData: null,
      opcodeInstructions: [],
      cfgData: null,
      loading: false,
      error: null,
    });
  }, []);

  const value: AppContextType = {
    state,
    loadBytecodeFile,
    loadBytecodeHex,
    clearData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Helper function to extract hex from bytecode format
function extractHexFromBytecode(bytecode: string): string {
  const lines = bytecode.split('\n');
  let hex = '';
  
  for (const line of lines) {
    // Parse format: "0x0000: 6060 4052 3415 6100 0f57 6000 8035 0315 |..@R4.a..W...5..|"
    const hexMatch = line.match(/0x[0-9a-fA-F]+:\s+([0-9a-fA-F\s]+)\s*\|/);
    if (hexMatch) {
      // Remove all spaces from hex data
      hex += hexMatch[1].replace(/\s/g, '');
    }
  }
  
  console.log("🔍 extractHexFromBytecode input lines:", lines.slice(0, 3));
  console.log("🔍 extractHexFromBytecode output hex:", hex.length > 0 ? hex.substring(0, 50) + "..." : "EMPTY");
  
  return hex ? '0x' + hex : '';
}

// Helper function to format hex as bytecode display
function formatHexAsBytecode(hex: string): string {
  const cleanHex = hex.replace(/0x/g, '').replace(/\s/g, '');
  let result = '';
  
  for (let i = 0; i < cleanHex.length; i += 32) {
    const offset = i / 2;
    const chunk = cleanHex.slice(i, i + 32);
    const formattedChunk = chunk.match(/.{1,2}/g)?.join(' ') || chunk;
    result += `0x${offset.toString(16).padStart(4, '0')}: ${formattedChunk}\n`;
  }
  
  return result;
}
