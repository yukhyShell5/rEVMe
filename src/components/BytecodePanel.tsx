import React from "react";

export const BytecodePanel: React.FC = () => {
  return (
    <div className="w-full h-full p-4 text-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide muted mb-3">Bytecode</h2>
      <pre className="card p-3 text-xs" style={{ maxHeight: 'calc(100% - 2rem)' }}>
{`// Example bytecode
0x00 PUSH1 0x60
0x02 PUSH1 0x40
0x04 MSTORE
// ...`}
      </pre>
    </div>
  );
};

export default BytecodePanel;
