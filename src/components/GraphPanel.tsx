import React, { useState, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeTypes,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface OpcodeInstruction {
  pc: number;
  opcode: string;
  args: string[];
  gas: number;
  stack_before: string[];
  stack_after: string[];
}

interface CFGNode {
  id: string;
  start_pc: number;
  end_pc: number;
  instructions: OpcodeInstruction[];
  node_type: string;
}

interface CFGEdge {
  id: string;
  source: string;
  target: string;
  edge_type: string;
}

interface CFGData {
  nodes: CFGNode[];
  edges: CFGEdge[];
}

const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const nodeTypeColors = {
    basic: "bg-blue-800 border-blue-600",
    jump: "bg-yellow-800 border-yellow-600",
    conditional: "bg-purple-800 border-purple-600",
    terminal: "bg-red-800 border-red-600",
  };

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 text-xs font-mono text-white min-w-32 ${
        nodeTypeColors[data.node_type as keyof typeof nodeTypeColors] || "bg-gray-800 border-gray-600"
      } ${selected ? "ring-2 ring-blue-400" : ""}`}
    >
      <div className="font-bold mb-1">
        Block 0x{data.start_pc.toString(16).padStart(4, "0")}
      </div>
      <div className="space-y-0.5">
        {data.instructions.slice(0, 3).map((inst: OpcodeInstruction, idx: number) => (
          <div key={idx} className="flex justify-between">
            <span className="text-green-300">{inst.opcode}</span>
            <span className="text-gray-400 text-xs">
              {inst.args.length > 0 ? inst.args[0]?.slice(0, 6) + "..." : ""}
            </span>
          </div>
        ))}
        {data.instructions.length > 3 && (
          <div className="text-gray-500 text-center">
            +{data.instructions.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export const GraphPanel: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bytecode, setBytecode] = useState("");
  const [selectedNode, setSelectedNode] = useState<CFGNode | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleGenerateCFG = async () => {
    if (!bytecode.trim()) {
      setError("Please enter bytecode");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await invoke<CFGData>("generate_cfg", {
        bytecodeHex: bytecode.trim(),
      });

      const reactFlowNodes: Node[] = result.nodes.map((node, index) => ({
        id: node.id,
        type: "custom",
        position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 200 },
        data: node,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      }));

      const reactFlowEdges: Edge[] = result.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: edge.edge_type === "jump" || edge.edge_type === "true",
        style: {
          stroke: 
            edge.edge_type === "true" ? "#10b981" :
            edge.edge_type === "false" ? "#ef4444" :
            edge.edge_type === "jump" ? "#f59e0b" : "#6b7280",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 
            edge.edge_type === "true" ? "#10b981" :
            edge.edge_type === "false" ? "#ef4444" :
            edge.edge_type === "jump" ? "#f59e0b" : "#6b7280",
        },
        label: edge.edge_type !== "fallthrough" ? edge.edge_type : "",
        labelStyle: { 
          fontSize: 10, 
          fontWeight: 600,
          fill: 
            edge.edge_type === "true" ? "#10b981" :
            edge.edge_type === "false" ? "#ef4444" :
            edge.edge_type === "jump" ? "#f59e0b" : "#6b7280",
        },
        labelBgStyle: { fill: "#1f2937", fillOpacity: 0.8 },
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    } catch (err) {
      setError(err as string);
      console.error("Failed to generate CFG:", err);
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node.data as CFGNode);
      setShowSidePanel(true);
    },
    []
  );

  const layoutedNodes = useMemo(() => {
    if (nodes.length === 0) return nodes;
    
    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    const visited = new Set();
    const positions = new Map();
    let yLevel = 0;
    
    const dfs = (nodeId: string, level: number, xOffset: number) => {
      if (visited.has(nodeId) || !nodeMap.has(nodeId)) return xOffset;
      
      visited.add(nodeId);
      positions.set(nodeId, { x: xOffset * 280, y: level * 180 });
      
      const outgoingEdges = edges.filter(edge => edge.source === nodeId);
      let currentX = xOffset;
      
      outgoingEdges.forEach(edge => {
        currentX = dfs(edge.target, level + 1, currentX);
        currentX++;
      });
      
      return currentX;
    };
    
    if (nodes.length > 0) {
      dfs(nodes[0].id, 0, 0);
    }
    
    return nodes.map(node => ({
      ...node,
      position: positions.get(node.id) || node.position
    }));
  }, [nodes, edges]);

  return (
    <div className="w-full h-full flex bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
              Control Flow Graph
            </h2>
            <button
              onClick={() => setShowSidePanel(false)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                showSidePanel
                  ? "bg-gray-700 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {showSidePanel ? "Hide Panel" : "Show Panel"}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={bytecode}
              onChange={(e) => setBytecode(e.target.value)}
              placeholder="Enter EVM bytecode (hex)..."
              className="flex-1 px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleGenerateCFG}
              disabled={loading}
              className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded transition-colors"
            >
              {loading ? "Generating..." : "Generate CFG"}
            </button>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-900/50 border border-red-700/50 rounded text-red-200 text-xs">
              Error: {error}
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-900">
          <ReactFlow
            nodes={layoutedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-900"
          >
            <Controls className="bg-gray-800 border border-gray-700" />
            <MiniMap
              className="bg-gray-800 border border-gray-700"
              nodeColor={(node) => {
                const colors = {
                  basic: "#1e40af",
                  jump: "#d97706",
                  conditional: "#7c3aed",
                  terminal: "#dc2626",
                };
                return colors[node.data?.node_type as keyof typeof colors] || "#6b7280";
              }}
            />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color="#374151" 
            />
          </ReactFlow>
        </div>
      </div>

      {showSidePanel && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Node Details</h3>
            {selectedNode && (
              <div className="mt-2 text-xs text-gray-300">
                Block 0x{selectedNode.start_pc.toString(16).padStart(4, "0")} - 
                0x{selectedNode.end_pc.toString(16).padStart(4, "0")}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedNode ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-3">
                  Type: <span className="text-white">{selectedNode.node_type}</span>
                </div>
                
                <div className="space-y-1">
                  {selectedNode.instructions.map((inst, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-900 p-2 rounded text-xs font-mono"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400">
                          0x{inst.pc.toString(16).padStart(4, "0")}
                        </span>
                        <span className="text-yellow-300">{inst.gas}</span>
                      </div>
                      <div className="text-blue-300 font-bold">{inst.opcode}</div>
                      {inst.args.length > 0 && (
                        <div className="text-green-300 mt-1">
                          {inst.args.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-2xl mb-2">📊</div>
                <div>Click on a node to view details</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphPanel;
