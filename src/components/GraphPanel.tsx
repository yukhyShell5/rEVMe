import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
} from "reactflow";

import "reactflow/dist/style.css";
import { useAppStore } from "../hooks/useAppStore";

const GraphPanel: React.FC = () => {
  const { state } = useAppStore();
  const { cfgData, bytecodeData, loading, error } = state;
  
  // Debug logging
  React.useEffect(() => {
    console.log("📊 GraphPanel - MOUNTED with store");
    console.log("📊 GraphPanel - Initial state:", { cfgData: cfgData ? `${cfgData.nodes?.length} nodes` : "null", bytecodeData, loading, error });
  }, []);

  React.useEffect(() => {
    console.log("📊 GraphPanel - cfgData changed:", cfgData ? `${cfgData.nodes?.length} nodes, ${cfgData.edges?.length} edges` : "null");
  }, [cfgData]);

  React.useEffect(() => {
    console.log("📄 GraphPanel - bytecodeData changed:", bytecodeData?.filename);
  }, [bytecodeData]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Update nodes and edges when CFG data changes
  useEffect(() => {
    if (cfgData) {
      const formattedNodes: Node[] = cfgData.nodes.map((node) => ({
        id: node.id.toString(),
        type: 'default',
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.label || `Block ${node.id}`,
          opcodes: node.opcodes || [],
          entry: node.entry_pc || 0,
          exit: node.exit_pc || 0,
        },
        style: {
          background: node.is_terminal ? '#dc2626' : '#1e40af',
          color: '#ffffff',
          border: '2px solid #374151',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          fontSize: '12px',
        },
      }));

      const formattedEdges: Edge[] = cfgData.edges.map((edge, index) => ({
        id: `e${edge.source}-${edge.target}-${index}`,
        source: edge.source.toString(),
        target: edge.target.toString(),
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#6b7280',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6b7280',
        },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    }
  }, [cfgData, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-gray-600">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white mb-2">
            Control Flow Graph
          </h2>
          
          {loading && (
            <div className="text-xs text-gray-300 mb-2">
              Loading CFG...
            </div>
          )}

          {error && (
            <div className="text-xs text-red-300 mb-2">
              Error: {error}
            </div>
          )}

          {bytecodeData && (
            <div className="text-xs text-gray-300 mb-2">
              CFG for: <strong>{bytecodeData.filename}</strong>
            </div>
          )}
          
          <div className="text-xs text-gray-400 space-y-1">
            <div>Nodes: {nodes.length}</div>
            <div>Edges: {edges.length}</div>
            {selectedNode && (
              <div className="mt-2 pt-2 border-t border-gray-600">
                <div className="font-medium text-blue-300">Selected Block</div>
                <div>ID: {selectedNode.id}</div>
                <div>Entry: 0x{selectedNode.data.entry?.toString(16) || '0'}</div>
                <div>Exit: 0x{selectedNode.data.exit?.toString(16) || '0'}</div>
              </div>
            )}
          </div>
        </div>

        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{
              padding: 0.2,
              includeHiddenNodes: false,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <MiniMap
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
              }}
              nodeColor="#1e40af"
              maskColor="rgba(0, 0, 0, 0.2)"
            />
            <Controls
              style={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
              }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#374151"
            />
          </ReactFlow>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            {cfgData 
              ? "No CFG data available"
              : "No bytecode loaded. Open a .bin file or use the menu to load bytecode."
            }
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="w-80 bg-gray-800 border-l border-gray-600 p-4 overflow-auto">
          <h3 className="text-sm font-semibold mb-3 text-blue-300">
            Block {selectedNode.id} Details
          </h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-gray-400">Entry PC:</span>
              <div className="font-mono mt-1">0x{(selectedNode.data.entry || 0).toString(16).padStart(4, '0')}</div>
            </div>
            
            <div>
              <span className="text-gray-400">Exit PC:</span>
              <div className="font-mono mt-1">0x{(selectedNode.data.exit || 0).toString(16).padStart(4, '0')}</div>
            </div>
            
            {selectedNode.data.opcodes && selectedNode.data.opcodes.length > 0 && (
              <div>
                <span className="text-gray-400">Opcodes:</span>
                <div className="mt-2 space-y-1">
                  {selectedNode.data.opcodes.map((opcode: any, i: number) => (
                    <div key={i} className="font-mono text-xs bg-gray-900 p-2 rounded">
                      <div className="text-blue-300">{opcode.opcode}</div>
                      {opcode.args && opcode.args.length > 0 && (
                        <div className="text-green-300 ml-2">
                          {opcode.args.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <span className="text-gray-400">Connections:</span>
              <div className="mt-1">
                <div>Incoming: {edges.filter((e: Edge) => e.target === selectedNode.id).length}</div>
                <div>Outgoing: {edges.filter((e: Edge) => e.source === selectedNode.id).length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphPanel;
