use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BytecodeData {
    filename: String,
    bytecode: String,
    size: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OpcodeInstruction {
    pc: usize,
    opcode: String,
    args: Vec<String>,
    gas: u32,
    stack_before: Vec<String>,
    stack_after: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CFGNode {
    id: String,
    start_pc: usize,
    end_pc: usize,
    instructions: Vec<OpcodeInstruction>,
    node_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CFGEdge {
    id: String,
    source: String,
    target: String,
    edge_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CFGData {
    nodes: Vec<CFGNode>,
    edges: Vec<CFGEdge>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn disassemble_bytecode(bytecode_hex: String) -> Result<Vec<OpcodeInstruction>, String> {
    let bytecode = hex_to_bytes(&bytecode_hex)?;
    let instructions = parse_evm_bytecode(&bytecode)?;
    Ok(instructions)
}

#[tauri::command]
fn generate_cfg(bytecode_hex: String) -> Result<CFGData, String> {
    let bytecode = hex_to_bytes(&bytecode_hex)?;
    let instructions = parse_evm_bytecode(&bytecode)?;
    let cfg = build_control_flow_graph(&instructions)?;
    Ok(cfg)
}

fn build_control_flow_graph(instructions: &[OpcodeInstruction]) -> Result<CFGData, String> {
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut leaders = std::collections::HashSet::new();
    
    leaders.insert(0);
    
    for (i, instruction) in instructions.iter().enumerate() {
        match instruction.opcode.as_str() {
            "JUMP" | "JUMPI" => {
                if i + 1 < instructions.len() {
                    leaders.insert(instructions[i + 1].pc);
                }
            },
            "JUMPDEST" => {
                leaders.insert(instruction.pc);
            },
            "STOP" | "RETURN" | "REVERT" | "SELFDESTRUCT" | "INVALID" => {
                if i + 1 < instructions.len() {
                    leaders.insert(instructions[i + 1].pc);
                }
            },
            _ => {}
        }
    }
    
    let mut leader_list: Vec<usize> = leaders.into_iter().collect();
    leader_list.sort();
    
    for (block_idx, &leader_pc) in leader_list.iter().enumerate() {
        let start_idx = instructions.iter().position(|inst| inst.pc == leader_pc).unwrap();
        let end_idx = if block_idx + 1 < leader_list.len() {
            let next_leader = leader_list[block_idx + 1];
            instructions.iter().rposition(|inst| inst.pc < next_leader).unwrap_or(start_idx)
        } else {
            instructions.len() - 1
        };
        
        let block_instructions = instructions[start_idx..=end_idx].to_vec();
        let last_instruction = &block_instructions[block_instructions.len() - 1];
        
        let node_type = match last_instruction.opcode.as_str() {
            "JUMP" => "jump",
            "JUMPI" => "conditional",
            "STOP" | "RETURN" | "REVERT" | "SELFDESTRUCT" | "INVALID" => "terminal",
            _ => "basic"
        }.to_string();
        
        nodes.push(CFGNode {
            id: format!("block_{}", block_idx),
            start_pc: block_instructions[0].pc,
            end_pc: last_instruction.pc,
            instructions: block_instructions,
            node_type,
        });
    }
    
    for (i, node) in nodes.iter().enumerate() {
        let last_inst = &node.instructions[node.instructions.len() - 1];
        
        match last_inst.opcode.as_str() {
            "JUMP" => {
                for target_node in &nodes {
                    if target_node.node_type == "basic" || target_node.instructions[0].opcode == "JUMPDEST" {
                        edges.push(CFGEdge {
                            id: format!("edge_{}_{}", i, target_node.id),
                            source: node.id.clone(),
                            target: target_node.id.clone(),
                            edge_type: "jump".to_string(),
                        });
                        break;
                    }
                }
            },
            "JUMPI" => {
                if i + 1 < nodes.len() {
                    edges.push(CFGEdge {
                        id: format!("edge_{}_false", i),
                        source: node.id.clone(),
                        target: nodes[i + 1].id.clone(),
                        edge_type: "false".to_string(),
                    });
                }
                
                for target_node in &nodes {
                    if target_node.node_type == "basic" || target_node.instructions[0].opcode == "JUMPDEST" {
                        edges.push(CFGEdge {
                            id: format!("edge_{}_true", i),
                            source: node.id.clone(),
                            target: target_node.id.clone(),
                            edge_type: "true".to_string(),
                        });
                        break;
                    }
                }
            },
            "STOP" | "RETURN" | "REVERT" | "SELFDESTRUCT" | "INVALID" => {
            },
            _ => {
                if i + 1 < nodes.len() {
                    edges.push(CFGEdge {
                        id: format!("edge_{}_next", i),
                        source: node.id.clone(),
                        target: nodes[i + 1].id.clone(),
                        edge_type: "fallthrough".to_string(),
                    });
                }
            }
        }
    }
    
    Ok(CFGData { nodes, edges })
}

fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, String> {
    let hex = hex.trim_start_matches("0x");
    if hex.len() % 2 != 0 {
        return Err("Hex string must have even length".to_string());
    }
    
    let mut bytes = Vec::new();
    for chunk in hex.as_bytes().chunks(2) {
        let hex_str = std::str::from_utf8(chunk).map_err(|_| "Invalid UTF-8")?;
        let byte = u8::from_str_radix(hex_str, 16).map_err(|_| "Invalid hex character")?;
        bytes.push(byte);
    }
    Ok(bytes)
}

fn parse_evm_bytecode(bytecode: &[u8]) -> Result<Vec<OpcodeInstruction>, String> {
    let mut instructions = Vec::new();
    let mut pc = 0;
    let mut stack: Vec<String> = Vec::new();

    while pc < bytecode.len() {
        let opcode_byte = bytecode[pc];
        let (opcode_name, gas_cost, args, stack_consumed, stack_produced) = get_opcode_info(opcode_byte);
        
        let mut args_vec = Vec::new();
        let mut next_pc = pc + 1;
        
        for i in 0..args {
            if next_pc + i < bytecode.len() {
                args_vec.push(format!("0x{:02x}", bytecode[next_pc + i]));
            }
        }
        next_pc += args;
        
        let stack_before = stack.clone();
        
        for _ in 0..stack_consumed.min(stack.len()) {
            stack.pop();
        }
        
        for i in 0..stack_produced {
            stack.push(format!("stack_item_{}", i));
        }
        
        let stack_after = stack.clone();
        
        instructions.push(OpcodeInstruction {
            pc,
            opcode: opcode_name.to_string(),
            args: args_vec,
            gas: gas_cost,
            stack_before,
            stack_after,
        });
        
        pc = next_pc;
    }
    
    Ok(instructions)
}

fn get_opcode_info(opcode: u8) -> (&'static str, u32, usize, usize, usize) {
    match opcode {
        0x00 => ("STOP", 0, 0, 0, 0),
        0x01 => ("ADD", 3, 0, 2, 1),
        0x02 => ("MUL", 5, 0, 2, 1),
        0x03 => ("SUB", 3, 0, 2, 1),
        0x04 => ("DIV", 5, 0, 2, 1),
        0x05 => ("SDIV", 5, 0, 2, 1),
        0x06 => ("MOD", 5, 0, 2, 1),
        0x07 => ("SMOD", 5, 0, 2, 1),
        0x08 => ("ADDMOD", 8, 0, 3, 1),
        0x09 => ("MULMOD", 8, 0, 3, 1),
        0x0a => ("EXP", 10, 0, 2, 1),
        0x0b => ("SIGNEXTEND", 5, 0, 2, 1),
        0x10 => ("LT", 3, 0, 2, 1),
        0x11 => ("GT", 3, 0, 2, 1),
        0x12 => ("SLT", 3, 0, 2, 1),
        0x13 => ("SGT", 3, 0, 2, 1),
        0x14 => ("EQ", 3, 0, 2, 1),
        0x15 => ("ISZERO", 3, 0, 1, 1),
        0x16 => ("AND", 3, 0, 2, 1),
        0x17 => ("OR", 3, 0, 2, 1),
        0x18 => ("XOR", 3, 0, 2, 1),
        0x19 => ("NOT", 3, 0, 1, 1),
        0x1a => ("BYTE", 3, 0, 2, 1),
        0x1b => ("SHL", 3, 0, 2, 1),
        0x1c => ("SHR", 3, 0, 2, 1),
        0x1d => ("SAR", 3, 0, 2, 1),
        0x20 => ("SHA3", 30, 0, 2, 1),
        0x30 => ("ADDRESS", 2, 0, 0, 1),
        0x31 => ("BALANCE", 100, 0, 1, 1),
        0x32 => ("ORIGIN", 2, 0, 0, 1),
        0x33 => ("CALLER", 2, 0, 0, 1),
        0x34 => ("CALLVALUE", 2, 0, 0, 1),
        0x35 => ("CALLDATALOAD", 3, 0, 1, 1),
        0x36 => ("CALLDATASIZE", 2, 0, 0, 1),
        0x37 => ("CALLDATACOPY", 3, 0, 3, 0),
        0x38 => ("CODESIZE", 2, 0, 0, 1),
        0x39 => ("CODECOPY", 3, 0, 3, 0),
        0x3a => ("GASPRICE", 2, 0, 0, 1),
        0x3b => ("EXTCODESIZE", 100, 0, 1, 1),
        0x3c => ("EXTCODECOPY", 100, 0, 4, 0),
        0x3d => ("RETURNDATASIZE", 2, 0, 0, 1),
        0x3e => ("RETURNDATACOPY", 3, 0, 3, 0),
        0x3f => ("EXTCODEHASH", 100, 0, 1, 1),
        0x40 => ("BLOCKHASH", 20, 0, 1, 1),
        0x41 => ("COINBASE", 2, 0, 0, 1),
        0x42 => ("TIMESTAMP", 2, 0, 0, 1),
        0x43 => ("NUMBER", 2, 0, 0, 1),
        0x44 => ("DIFFICULTY", 2, 0, 0, 1),
        0x45 => ("GASLIMIT", 2, 0, 0, 1),
        0x46 => ("CHAINID", 2, 0, 0, 1),
        0x47 => ("SELFBALANCE", 5, 0, 0, 1),
        0x48 => ("BASEFEE", 2, 0, 0, 1),
        0x50 => ("POP", 2, 0, 1, 0),
        0x51 => ("MLOAD", 3, 0, 1, 1),
        0x52 => ("MSTORE", 3, 0, 2, 0),
        0x53 => ("MSTORE8", 3, 0, 2, 0),
        0x54 => ("SLOAD", 100, 0, 1, 1),
        0x55 => ("SSTORE", 100, 0, 2, 0),
        0x56 => ("JUMP", 8, 0, 1, 0),
        0x57 => ("JUMPI", 10, 0, 2, 0),
        0x58 => ("PC", 2, 0, 0, 1),
        0x59 => ("MSIZE", 2, 0, 0, 1),
        0x5a => ("GAS", 2, 0, 0, 1),
        0x5b => ("JUMPDEST", 1, 0, 0, 0),
        0x60..=0x7f => {
            let push_size = (opcode - 0x60 + 1) as usize;
            (match push_size {
                1 => "PUSH1", 2 => "PUSH2", 3 => "PUSH3", 4 => "PUSH4", 5 => "PUSH5", 6 => "PUSH6", 7 => "PUSH7", 8 => "PUSH8",
                9 => "PUSH9", 10 => "PUSH10", 11 => "PUSH11", 12 => "PUSH12", 13 => "PUSH13", 14 => "PUSH14", 15 => "PUSH15", 16 => "PUSH16",
                17 => "PUSH17", 18 => "PUSH18", 19 => "PUSH19", 20 => "PUSH20", 21 => "PUSH21", 22 => "PUSH22", 23 => "PUSH23", 24 => "PUSH24",
                25 => "PUSH25", 26 => "PUSH26", 27 => "PUSH27", 28 => "PUSH28", 29 => "PUSH29", 30 => "PUSH30", 31 => "PUSH31", 32 => "PUSH32",
                _ => "PUSH"
            }, 3, push_size, 0, 1)
        },
        0x80..=0x8f => {
            let dup_pos = (opcode - 0x80 + 1) as usize;
            (match dup_pos {
                1 => "DUP1", 2 => "DUP2", 3 => "DUP3", 4 => "DUP4", 5 => "DUP5", 6 => "DUP6", 7 => "DUP7", 8 => "DUP8",
                9 => "DUP9", 10 => "DUP10", 11 => "DUP11", 12 => "DUP12", 13 => "DUP13", 14 => "DUP14", 15 => "DUP15", 16 => "DUP16",
                _ => "DUP"
            }, 3, 0, dup_pos, dup_pos + 1)
        },
        0x90..=0x9f => {
            let swap_pos = (opcode - 0x90 + 1) as usize;
            (match swap_pos {
                1 => "SWAP1", 2 => "SWAP2", 3 => "SWAP3", 4 => "SWAP4", 5 => "SWAP5", 6 => "SWAP6", 7 => "SWAP7", 8 => "SWAP8",
                9 => "SWAP9", 10 => "SWAP10", 11 => "SWAP11", 12 => "SWAP12", 13 => "SWAP13", 14 => "SWAP14", 15 => "SWAP15", 16 => "SWAP16",
                _ => "SWAP"
            }, 3, 0, swap_pos + 1, swap_pos + 1)
        },
        0xa0..=0xa4 => {
            let log_topics = (opcode - 0xa0) as usize;
            (match log_topics {
                0 => "LOG0", 1 => "LOG1", 2 => "LOG2", 3 => "LOG3", 4 => "LOG4",
                _ => "LOG"
            }, 375, 0, log_topics + 2, 0)
        },
        0xf0 => ("CREATE", 32000, 0, 3, 1),
        0xf1 => ("CALL", 100, 0, 7, 1),
        0xf2 => ("CALLCODE", 100, 0, 7, 1),
        0xf3 => ("RETURN", 0, 0, 2, 0),
        0xf4 => ("DELEGATECALL", 100, 0, 6, 1),
        0xf5 => ("CREATE2", 32000, 0, 4, 1),
        0xfa => ("STATICCALL", 100, 0, 6, 1),
        0xfd => ("REVERT", 0, 0, 2, 0),
        0xfe => ("INVALID", 0, 0, 0, 0),
        0xff => ("SELFDESTRUCT", 0, 0, 1, 0),
        _ => ("UNKNOWN", 0, 0, 0, 0),
    }
}

#[tauri::command]
async fn open_bin_file(app: tauri::AppHandle) -> Result<Option<BytecodeData>, String> {
    use std::sync::{Arc, Mutex};
    use std::time::{Duration, Instant};
    use tauri_plugin_dialog::{DialogExt, FilePath};
    
    let result: Arc<Mutex<Option<Option<FilePath>>>> = Arc::new(Mutex::new(None));
    let result_clone = Arc::clone(&result);
    
    // Open the file dialog
    app.dialog()
        .file()
        .add_filter("Binary files", &["bin"])
        .pick_file(move |file_path| {
            let mut result = result_clone.lock().unwrap();
            *result = Some(file_path);
        });
    
    // Wait for the dialog result (with timeout)
    let start = Instant::now();
    let timeout = Duration::from_secs(60); // 60 second timeout
    
    loop {
        if start.elapsed() > timeout {
            return Err("Dialog timeout".to_string());
        }
        
        let result_guard = result.lock().unwrap();
        if let Some(file_path_option) = result_guard.as_ref() {
            let file_path_copy = file_path_option.clone();
            drop(result_guard);
            
            match file_path_copy {
                Some(file_path) => {
                    if let Some(path) = file_path.as_path() {
                        match read_bin_file(path) {
                            Ok(data) => return Ok(Some(data)),
                            Err(e) => return Err(format!("Failed to read file: {}", e)),
                        }
                    } else {
                        return Err("Invalid file path".to_string());
                    }
                }
                None => {
                    return Ok(None); // User cancelled
                }
            }
        } else {
            drop(result_guard);
        }
        
        // Small delay to prevent busy waiting
        std::thread::sleep(Duration::from_millis(50));
    }
}

#[tauri::command]
fn read_bin_file_path(file_path: String) -> Result<BytecodeData, String> {
    let path = Path::new(&file_path);
    read_bin_file(path)
}

fn read_bin_file(file_path: &Path) -> Result<BytecodeData, String> {
    let filename = file_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown.bin")
        .to_string();

    match fs::read(file_path) {
        Ok(bytes) => {
            let bytecode = format_bytecode(&bytes);
            Ok(BytecodeData {
                filename,
                bytecode,
                size: bytes.len(),
            })
        }
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

fn format_bytecode(bytes: &[u8]) -> String {
    let mut result = String::new();
    
    for (i, chunk) in bytes.chunks(16).enumerate() {
        let offset = i * 16;
        result.push_str(&format!("0x{:04x}: ", offset));
        
        // Hex bytes
        for (j, byte) in chunk.iter().enumerate() {
            result.push_str(&format!("{:02x}", byte));
            if j % 2 == 1 {
                result.push(' ');
            }
        }
        
        // Pad if needed
        if chunk.len() < 16 {
            let remaining = 16 - chunk.len();
            for _ in 0..remaining {
                result.push_str("  ");
                if (chunk.len() + remaining - 1) % 2 == 1 {
                    result.push(' ');
                }
            }
        }
        
        // ASCII representation
        result.push_str(" |");
        for byte in chunk {
            if byte.is_ascii_graphic() || *byte == b' ' {
                result.push(*byte as char);
            } else {
                result.push('.');
            }
        }
        result.push_str("|\n");
    }
    
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, open_bin_file, disassemble_bytecode, generate_cfg])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
