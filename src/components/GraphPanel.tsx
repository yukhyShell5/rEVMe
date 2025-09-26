import React from "react";

export const GraphPanel: React.FC = () => {
  return (
    <div className="w-full h-full p-4 text-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide muted mb-3">Graph</h2>
      <div className="card w-full h-[calc(100%-2rem)] min-h-40 rounded flex items-center justify-center">
        Graph placeholder
      </div>
    </div>
  );
};

export default GraphPanel;
