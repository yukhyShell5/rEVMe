import React from "react";

export const OpcodesPanel: React.FC = () => {
  return (
    <div className="w-full h-full p-4 text-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide muted mb-3">Opcodes</h2>
      <div className="card p-3">
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>PUSH1</li>
          <li>MSTORE</li>
          <li>CALL</li>
          <li>RETURN</li>
          <li>STOP</li>
        </ul>
      </div>
    </div>
  );
};

export default OpcodesPanel;
