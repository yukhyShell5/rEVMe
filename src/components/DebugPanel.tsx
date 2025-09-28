import React from "react";
import { useAppStore } from "../hooks/useAppStore";

export const DebugPanel: React.FC = () => {
  const { state, loadBytecodeFile, toggleDebugPanel } = useAppStore();
  const { bytecodeData, opcodeInstructions, cfgData, loading, error, debugPanelVisible } = state;
  const [position, setPosition] = React.useState({ x: window.innerWidth - 340, y: window.innerHeight - 280 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleTestLoad = async () => {
    console.log("🧪 Testing loadBytecodeFile...");
    await loadBytecodeFile();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 260, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Ne pas afficher si le panel n'est pas visible
  if (!debugPanelVisible) {
    return null;
  }

  return (
    <div 
      className="fixed bg-gray-800 border border-gray-600 rounded-lg p-4 text-xs text-white w-80 max-h-60 overflow-auto z-50 select-none cursor-move"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">🐛 Debug Panel</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDebugPanel}
            className="text-xs text-gray-400 hover:text-white px-1"
            title="Close Debug Panel"
          >
            ✕
          </button>
          <div className="text-xs text-gray-400">
            {isDragging ? "Dragging..." : "Drag to move"}
          </div>
        </div>
      </div>
      
      <button
        onClick={handleTestLoad}
        className="mb-2 px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
      >
        Test Load File
      </button>
      
      <div className="space-y-1">
        <div>Loading: <span className={loading ? "text-yellow-300" : "text-gray-400"}>{String(loading)}</span></div>
        <div>Error: <span className={error ? "text-red-300" : "text-gray-400"}>{error || "none"}</span></div>
        <div>Bytecode: <span className={bytecodeData ? "text-green-300" : "text-gray-400"}>{bytecodeData ? `${bytecodeData.filename} (${bytecodeData.size}b)` : "none"}</span></div>
        <div>Opcodes: <span className={opcodeInstructions?.length ? "text-green-300" : "text-gray-400"}>{opcodeInstructions?.length || 0} instructions</span></div>
        <div>CFG: <span className={cfgData ? "text-green-300" : "text-gray-400"}>{cfgData ? `${cfgData.nodes?.length || 0} nodes` : "none"}</span></div>
      </div>
    </div>
  );
};

export default DebugPanel;
