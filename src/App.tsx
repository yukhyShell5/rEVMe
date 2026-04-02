import { useEffect, useState } from 'react';
import './legacy'; // Import the legacy vanilla logic for now

const CODEBASE_PRESETS = [
  { id: '1', name: 'SLOAD Influenced by CALLER', code: `// Trouve tous les chemins où SLOAD(X) est influencé par CALLER
const callerNodes = instructions.filter(i => i.opcode === 'CALLER');
const sloadNodes = instructions.filter(i => i.opcode === 'SLOAD');

const results = [];
for (let source of callerNodes) {
  for (let sink of sloadNodes) {
    if (TaintEngine.flowsTo(source.offset, sink.offset, instructions)) {
      results.push({
        offset: sink.offset,
        msg: \`SLOAD vulnérable influencé par CALLER (offset 0x\${source.offset.toString(16)})\`
      });
    }
  }
}
return results;` },
  { id: '2', name: 'Wait Pattern (Reentrancy)', code: `// Détection de Reentrancy basique (CALL en amont d'un SSTORE)
const callNodes = instructions.filter(i => i.opcode === 'CALL');
const sstoreNodes = instructions.filter(i => i.opcode === 'SSTORE');

const results = [];
for (let call of callNodes) {
  for (let sstore of sstoreNodes) {
    if (TaintEngine.flowsTo(call.offset, sstore.offset, instructions)) {
      results.push({ offset: sstore.offset, msg: 'SSTORE après un CALL (Risque de Réentrance potentiel)' });
    }
  }
}
return results;` },
  { id: '3', name: 'Unprotected SELFDESTRUCT', code: `// Détection d'un SELFDESTRUCT
const selfDestructs = instructions.filter(i => i.opcode === 'SELFDESTRUCT');

const results = [];
for (let sd of selfDestructs) {
  results.push({ offset: sd.offset, msg: 'Opération SELFDESTRUCT détectée' });
}
return results;` },
  { id: '4', name: 'Unsafe DELEGATECALL', code: `// Unsafe DelegateCall
const delCalls = instructions.filter(i => i.opcode === 'DELEGATECALL');

const results = [];
for (let dc of delCalls) {
  results.push({ offset: dc.offset, msg: 'DELEGATECALL détecté - vérifier les arguments de Destination' });
}
return results;` }
];

export default function App() {
  const [consoleVisible, setConsoleVisible] = useState(true);

  // Queries State
  const [queries, setQueries] = useState<{id: string, name: string, code: string}[]>(() => {
    const saved = localStorage.getItem('rEVMe_queries');
    return saved ? JSON.parse(saved) : CODEBASE_PRESETS;
  });
  const [activeQueryId, setActiveQueryId] = useState(queries[0]?.id);
  const [queryCode, setQueryCode] = useState(queries[0]?.code || '');

  const handleQuerySelect = (id: string) => {
    const q = queries.find(x => x.id === id);
    if(q) {
      setActiveQueryId(id);
      setQueryCode(q.code);
    }
  };

  const handleQuerySave = () => {
    const isPreset = CODEBASE_PRESETS.find(x => x.id === activeQueryId);
    let newQueries = [...queries];
    if (isPreset) {
      const name = prompt("Name for your custom query:") || 'Custom Query';
      const newId = Date.now().toString();
      newQueries.push({ id: newId, name, code: queryCode });
      setActiveQueryId(newId);
    } else {
      newQueries = queries.map(q => q.id === activeQueryId ? { ...q, code: queryCode } : q);
    }
    setQueries(newQueries);
    localStorage.setItem('rEVMe_queries', JSON.stringify(newQueries));
  };
  
  const handleQueryNew = () => {
     const name = prompt("Name for new query:") || "New Query";
     const newId = Date.now().toString();
     const newQueries = [...queries, { id: newId, name: name, code: '// Your query here\\nreturn [];' }];
     setQueries(newQueries);
     localStorage.setItem('rEVMe_queries', JSON.stringify(newQueries));
     setActiveQueryId(newId);
     setQueryCode('// Your query here\\nreturn [];');
  };

  useEffect(() => {
    // Optional: trigger an init function if needed
    if(window.__initLegacy) window.__initLegacy();

    if (window.ipcRenderer) {
      const cleanup = window.ipcRenderer.on('menu-action', (_event: any, action: string) => {
        if (action === 'toggleConsole') {
          setConsoleVisible(prev => !prev);
        } else if (action === 'exportDisasm' && window.exportDisasm) window.exportDisasm();
        else if (action === 'exportDecompiled' && window.exportDecompiled) window.exportDecompiled();
        else if (action === 'exportReport' && window.exportReport) window.exportReport();
        else if (action === 'loadSample' && window.loadSample) window.loadSample();
        else if (action === 'viewDisasm' && window.switchView) window.switchView('disasm');
        else if (action === 'viewDecompile' && window.switchView) window.switchView('decompile');
        else if (action === 'viewCfg' && window.switchView) window.switchView('cfg');
        else if (action === 'viewStorage' && window.switchView) window.switchView('storage');
        else if (action === 'viewStrings' && window.switchView) window.switchView('strings');
        else if (action === 'viewQueries' && window.switchView) window.switchView('queries');
        else if (action === 'analyzeContract' && window.analyzeContract) window.analyzeContract();
        else if (action === 'openApiKeyModal' && window.openApiKeyModal) window.openApiKeyModal();
        else if (action === 'openSearch' && window.openSearch) window.openSearch();
        else if (action === 'openGoto' && window.openGoto) window.openGoto();
        else if (action === 'cycleNetwork' && window.cycleNetwork) window.cycleNetwork();
        else if (action === 'loadABI' && window.loadABI) window.loadABI();
      });
      return cleanup;
    }
  }, []);

  return (
    <>
      
 
{/*  TITLE BAR  */}
<div className="titlebar">
  <div>
    <div className="logo">⬡ rEV<span style={{fontWeight: "500"}}>Me</span></div>
  </div>
  <div style={{marginLeft: "16px"}}></div>
  <div className="status-bar-top">
    <div className="badge badge-evm">EVM SOLIDITY</div>
    <div className="badge badge-net" id="network-badge">ETHEREUM</div>
  </div>
</div>
 
{/*  TOOLBAR  */}
<div className="toolbar">
  <div className="tool-btn active" onClick={() => window.switchView && window.switchView('disasm')}>⊞ Disasm</div>
  <div className="tool-btn" onClick={() => window.switchView && window.switchView('decompile')}>⟨/⟩ Decompile</div>
  <div className="tool-btn" onClick={() => window.switchView && window.switchView('cfg')}>◈ CFG</div>
  <div className="tool-sep"></div>
  <div className="tool-btn" onClick={() => window.switchView && window.switchView('storage')}>⊟ Storage</div>
  <div className="tool-btn" onClick={() => window.switchView && window.switchView('strings')}>❝ Strings</div>
  <div className="tool-sep"></div>
  <input className="addr-input" id="address-input" placeholder="0x... contract address or paste bytecode" />
  <button className="analyze-btn" onClick={() => window.analyzeContract && window.analyzeContract()}>▶ ANALYZE</button>
  <div className="tool-sep"></div>
  <div className="tool-btn" onClick={() => window.loadABI && window.loadABI()} title="Load ABI JSON to annotate selectors">⊕ ABI</div>
  <div className="tool-btn" onClick={() => window.openApiKeyModal && window.openApiKeyModal()} title="Set Etherscan API key for verified ABIs">⚿ API Key</div>
  <div className="tool-sep"></div>
  <div className="tool-btn" id="network-btn" onClick={() => window.cycleNetwork && window.cycleNetwork()}>⊕ Mainnet</div>
</div>
 
{/*  API KEY MODAL  */}
<div id="modal-overlay" style={{display: "none", position: "fixed", inset: "0", background: "rgba(0,0,0,0.7)", zIndex: "999", alignItems: "center", justifyContent: "center"}}>
  <div style={{background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "8px", padding: "24px", width: "440px", maxWidth: "90vw"}}>
    <div style={{fontFamily: "'Orbitron',sans-serif", fontSize: "12px", color: "var(--accent)", letterSpacing: "2px", marginBottom: "16px"}}>⚿ ETHERSCAN API KEY</div>
    <div style={{color: "var(--text2)", fontSize: "11px", marginBottom: "12px", lineHeight: "1.7"}}>
      Enter your <a href="https://etherscan.io/myapikey" target="_blank" style={{color: "var(--accent)"}}>Etherscan API key</a> to fetch verified ABIs automatically.<br/>
      Without a key, the tool uses public endpoints (rate-limited). Key is saved locally.
    </div>
    <input id="modal-apikey-input" type="text" placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      style={{width: "100%", background: "var(--bg)", border: "1px solid var(--border2)", color: "var(--accent)", padding: "8px 12px", borderRadius: "4px", fontFamily: "'JetBrains Mono',monospace", fontSize: "12px", outline: "none", marginBottom: "12px"}} />
    <div style={{color: "var(--text3)", fontSize: "10px", marginBottom: "16px"}}>Works for: Etherscan, Arbiscan, Polygonscan, Basescan, BSCScan — same API format.</div>
    <div style={{display: "flex", gap: "8px", justifyContent: "flex-end"}}>
      <div className="tool-btn" onClick={() => window.closeApiKeyModal && window.closeApiKeyModal()}>Cancel</div>
      <button className="analyze-btn" onClick={() => window.saveApiKey && window.saveApiKey()}>Save</button>
    </div>
  </div>
</div>
 
{/*  SEARCH BAR  */}
<div className="search-bar" id="search-bar">
  <input className="search-input" id="search-input" placeholder="Search opcodes, operands..." />
  <span className="search-count" id="search-count"></span>
  <span className="search-close" onClick={() => window.closeSearch && window.closeSearch()}>✕</span>
</div>
 
{/*  GOTO OFFSET MODAL  */}
<div className="goto-modal" id="goto-modal">
  <div className="goto-box">
    <div className="goto-title">⊞ Go to offset</div>
    <input className="goto-input" id="goto-input" placeholder="0x00a4 or 164" />
    <div className="goto-hint">Enter hex (0x...) or decimal offset · Press Enter to jump · Esc to cancel</div>
  </div>
</div>
 
{/*  WORKSPACE  */}
<div className={`workspace ${consoleVisible ? '' : 'workspace-no-console'}`}>
 
  {/*  FUNCTIONS PANEL  */}
  <div className="panel panel-left">
    <div className="panel-header">
      <div className="panel-title">Functions</div>
      <div className="panel-badge" id="fn-count">0 fns</div>
    </div>
    <div className="panel-content" id="functions-list">
      <div className="empty-state"><div className="empty-text">No contract loaded</div></div>
    </div>
  </div>
 
  {/*  CENTER PANEL: DISASM / DECOMPILE / CFG  */}
  <div className="panel panel-center" style={{display: "flex", flexDirection: "column"}}>
    <div className="tabs">
      <div className="tab active" id="tab-disasm" onClick={() => window.switchView && window.switchView('disasm')}><div className="tab-dot"></div>Disassembly</div>
      <div className="tab" id="tab-decompile" onClick={() => window.switchView && window.switchView('decompile')}><div className="tab-dot"></div>Decompiled</div>
      <div className="tab" id="tab-cfg" onClick={() => window.switchView && window.switchView('cfg')}><div className="tab-dot"></div>Control Flow</div>
      <div className="tab" id="tab-storage" onClick={() => window.switchView && window.switchView('storage')}><div className="tab-dot"></div>Storage</div>
      <div className="tab" id="tab-strings" onClick={() => window.switchView && window.switchView('strings')}><div className="tab-dot"></div>Strings</div>
      <div className="tab" id="tab-queries" onClick={() => window.switchView && window.switchView('queries')}><div className="tab-dot"></div>🔍 Queries</div>
    </div>
 
    {/*  DISASSEMBLY  */}
    <div className="disasm-view panel-content" id="view-disasm">
      <div className="empty-state" id="disasm-empty">
        <div className="empty-icon">⬡</div>
        <div className="empty-text">Paste bytecode or enter an address above</div>
      </div>
    </div>
 
    {/*  DECOMPILED  */}
    <div className="panel-content" id="view-decompile" style={{display: "none"}}>
      <div className="decompiled" id="decompile-content">
        <span className="dc-comment">// rEVMe Pseudo-Decompiler v1.0
// Load a contract to see decompiled output</span>
      </div>
    </div>
 
    {/*  CFG  */}
    <div id="view-cfg" style={{display: "none", flex: "1", overflow: "hidden", position: "relative"}}>
      <div className="cfg-container" id="cfg-container">
        <svg id="cfg-svg"></svg>
      </div>
      <div className="cfg-zoom-controls">
        <div className="cfg-zoom-btn" onClick={() => window.cfgZoom && window.cfgZoom(1.3)} title="Zoom In">+</div>
        <div className="cfg-zoom-btn" onClick={() => window.cfgZoom && window.cfgZoom(0.7)} title="Zoom Out">−</div>
        <div className="cfg-zoom-btn" onClick={() => window.cfgReset && window.cfgReset()} title="Reset View">⊞</div>
        <div className="cfg-zoom-btn" onClick={() => window.toggleCfgSettings && window.toggleCfgSettings(event)} title="Settings" id="cfg-settings-btn">⚙</div>
      </div>
      <div className="cfg-settings-panel" id="cfg-settings-panel">
        <div className="cfg-settings-title">⚙ CFG Settings</div>
        <label className="cfg-settings-row">
          <input type="checkbox" id="cfg-opt-constructor" defaultChecked onChange={() => window.cfgSettingChanged && window.cfgSettingChanged()} /> Display Constructor
        </label>
        <label className="cfg-settings-row">
          <input type="checkbox" id="cfg-opt-deadcode" onChange={() => window.cfgSettingChanged && window.cfgSettingChanged()} /> Display Dead Code
        </label>
        <div className="cfg-settings-divider"></div>
        <div className="cfg-settings-info" id="cfg-settings-info">56 blocks shown</div>
      </div>
    </div>
 
    {/*  STORAGE  */}
    <div className="panel-content" id="view-storage" style={{display: "none"}}>
      <table className="storage-table" id="storage-table">
        <tr><td colSpan={3} style={{padding: "20px", color: "var(--text3)", textAlign: "center"}}>Load a contract to view storage layout</td></tr>
      </table>
    </div>
 
    {/*  STRINGS  */}
    <div className="panel-content" id="view-strings" style={{display: "none"}}>
      <div id="strings-content" style={{padding: "10px"}}>
        <div style={{color: "var(--text3)", fontSize: "11px", padding: "10px 0"}}>Load a contract to extract strings</div>
      </div>
    </div>

    {/*  QUERIES ENGINE  */}
    <div className="panel-content" id="view-queries" style={{display: "none"}}>
      <div className="query-sidebar">
         <div className="query-sidebar-header">
           <div style={{fontWeight: "bold", fontSize: "11px", letterSpacing: "1px"}}>CODEBASE</div>
           <button className="query-new-btn" onClick={handleQueryNew}>+ New</button>
         </div>
         <div className="query-list">
           {queries.map(q => (
             <div key={q.id} className={`query-list-item ${q.id === activeQueryId ? 'active' : ''}`} onClick={() => handleQuerySelect(q.id)}>
               {q.name}
             </div>
           ))}
         </div>
      </div>
      <div className="query-main">
        <div className="query-toolbar">
          <div style={{fontSize: "10px", color: "var(--text2)", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase"}}>JS Taint Engine API</div>
          <div style={{display: "flex", gap: "8px"}}>
            <button className="analyze-btn" style={{background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)"}} onClick={handleQuerySave}>Save</button>
            <button className="analyze-btn" onClick={() => (window as any).runCustomQuery && (window as any).runCustomQuery()}>▶ RUN SCRIPT</button>
          </div>
        </div>
        <textarea id="query-editor" spellCheck="false" placeholder="// Taint Engine Playground..." value={queryCode} onChange={(e) => setQueryCode(e.target.value)}></textarea>
        <div id="query-results">
          <div style={{color: "var(--text3)", fontSize: "10px", textAlign: "center", marginTop: "40px"}}>Taint tracking results will appear here</div>
        </div>
      </div>
    </div>
  </div>
 
  {/*  RIGHT INFO PANEL  */}
  <div className="panel panel-right" style={{overflowY: "auto"}}>
    <div className="panel-header">
      <div className="panel-title">Inspector</div>
    </div>
 
    <div className="info-section">
      <div className="info-label">Contract</div>
      <div className="info-value accent" id="info-address">—</div>
    </div>
    <div className="info-section">
      <div className="info-label">Bytecode Size</div>
      <div className="info-value" id="info-size">—</div>
    </div>
    <div className="info-section">
      <div className="info-label">Opcodes</div>
      <div className="info-value" id="info-opcodes">—</div>
    </div>
    <div className="info-section">
      <div className="info-label">Compiler</div>
      <div className="info-value" id="info-compiler">—</div>
    </div>
    <div className="info-section">
      <div className="info-label">Proxy Pattern</div>
      <div className="info-value" id="info-proxy">—</div>
    </div>
    <div className="info-section">
      <div className="info-label">ERC Standards</div>
      <div className="info-value" id="info-erc">—</div>
    </div>
 
    <div className="panel-header" style={{marginTop: "4px"}}>
      <div className="panel-title">⚠ Vulnerabilities</div>
      <div className="panel-badge" id="vuln-count">—</div>
    </div>
    <div id="vuln-list">
      <div style={{padding: "12px 10px", color: "var(--text3)", fontSize: "10px"}}>Run analysis to detect vulnerabilities</div>
    </div>
 
    <div className="panel-header" style={{marginTop: "4px"}}>
      <div className="panel-title">Opcodes Distribution</div>
    </div>
    <div style={{padding: "8px 10px"}} id="opcode-dist"></div>
  </div>
 
  {/*  BOTTOM LEFT: CONSOLE  */}
  <div className="panel panel-bottom-left" style={{ display: consoleVisible ? 'flex' : 'none' }}>
    <div className="panel-header">
      <div className="panel-title">Output / Console</div>
      <div className="panel-badge">rEVMe Engine 1.0</div>
    </div>
    <div className="console" id="console">
      <div className="log-info"><span className="log-time">[00:00:00]</span>rEVMe Smart Contract Analyzer initialized.</div>
      <div className="log-info"><span className="log-time">[00:00:00]</span>EVM decoder ready. Paste bytecode or enter contract address.</div>
      <div className="log-info"><span className="log-time">[00:00:00]</span>Try the sample: <span style={{color: "var(--accent)", cursor: "pointer"}} onClick={() => window.loadSample && window.loadSample()}>▶ Load ERC-20 Sample</span></div>
    </div>
  </div>
 
  {/*  BOTTOM RIGHT: HEX / XREFS  */}
  {/* Removed Hex View panel */}
 
</div>
 
{/*  STATUS BAR  */}
<div className="statusbar">
  <div className="status-item"><div className="status-dot"></div><span className="status-ok" id="status-ready">Ready</span></div>
  <div className="status-item">Offset: <span className="status-accent" id="status-offset">—</span></div>
  <div className="status-item">Opcode: <span className="status-accent" id="status-opcode">—</span></div>
  <div className="status-item" id="status-vuln"></div>
  <div className="status-item" style={{marginLeft: "auto"}}>rEVMe v2.0 · EVM Analyzer</div>
</div>
 

    </>
  );
}
