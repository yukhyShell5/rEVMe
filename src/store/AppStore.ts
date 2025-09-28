// Simple event-based store for sharing data between Golden Layout components
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
  debugPanelVisible: boolean;
}

class AppStore {
  private data: AppState = {
    bytecodeData: null,
    opcodeInstructions: [],
    cfgData: null,
    loading: false,
    error: null,
    debugPanelVisible: false,
  };

  private listeners: Set<(data: AppState) => void> = new Set();

  subscribe(listener: (data: AppState) => void) {
    this.listeners.add(listener);
    // Immediately call with current data
    listener(this.data);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  setState(newData: Partial<AppState>) {
    this.data = { ...this.data, ...newData };
    this.listeners.forEach(listener => listener(this.data));
  }

  getState(): AppState {
    return this.data;
  }

  async loadBytecodeFile() {
    try {
      console.log("🚀 Starting loadBytecodeFile...");
      this.setState({ loading: true, error: null });
      
      const { invoke } = await import("@tauri-apps/api/core");
      console.log("📁 Opening file dialog...");
      const bytecodeResult = await invoke<BytecodeData | null>("open_bin_file");
      
      if (!bytecodeResult) {
        console.log("❌ No file selected or file opening failed");
        this.setState({ loading: false });
        return;
      }

      console.log("✅ File opened:", bytecodeResult.filename, `(${bytecodeResult.size} bytes)`);
      console.log("📄 Bytecode preview:", bytecodeResult.bytecode.substring(0, 200));

      // Extract hex from bytecode display format
      const hexData = this.extractHexFromBytecode(bytecodeResult.bytecode);
      console.log("🔍 Extracted hex data:", hexData.substring(0, 100) + "...");
      
      if (!hexData || hexData === '0x') {
        console.error("⚠️ Failed to extract hex data from bytecode");
        this.setState({
          loading: false,
          error: "Failed to extract hex data from bytecode",
        });
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

      this.setState({
        bytecodeData: bytecodeResult,
        opcodeInstructions: opcodeResult,
        cfgData: cfgResult,
        loading: false,
        error: null,
      });
      
      console.log("🎉 All data loaded successfully!");
    } catch (err) {
      console.error("💥 Error in loadBytecodeFile:", err);
      this.setState({
        loading: false,
        error: err as string,
      });
    }
  }

  toggleDebugPanel() {
    this.setState({ debugPanelVisible: !this.data.debugPanelVisible });
  }

  private extractHexFromBytecode(bytecode: string): string {
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
}

export const appStore = new AppStore();
