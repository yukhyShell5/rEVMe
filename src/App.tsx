import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";
import "./index.css";
import { GoldenLayout, LayoutConfig } from "golden-layout";
import BytecodePanel from "./components/BytecodePanel";
import OpcodesPanel from "./components/OpcodesPanel";
import GraphPanel from "./components/GraphPanel";
import MenuBar from "./components/MenuBar";
import StatusBar from "./components/StatusBar";
import DebugPanel from "./components/DebugPanel";
import { useLayoutManager } from "./hooks/useLayoutManager";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { appStore } from "./store/AppStore";

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<GoldenLayout | null>(null);
  const layoutManager = useLayoutManager();

  const handleOpenFile = () => {
    appStore.loadBytecodeFile();
  };

  const handleExit = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  const handleMinimizeShortcut = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleToggleDebug = () => {
    appStore.toggleDebugPanel();
  };

  useKeyboardShortcuts({
    onOpenFile: handleOpenFile,
    onExit: handleExit,
    onFullscreen: layoutManager.enterFullscreen,
    onMinimize: handleMinimizeShortcut,
    onToggleDebug: handleToggleDebug,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const gl = new GoldenLayout(containerRef.current);

    // Helper to mount a React component into a Golden Layout container
    function mountReact(container: any, Component: React.FC) {
      const mountEl = document.createElement("div");
      mountEl.style.width = "100%";
      mountEl.style.height = "100%";
      container.element.append(mountEl);
      const root = ReactDOM.createRoot(mountEl);
      
      // Simply render the component - it should inherit context from the parent app
      root.render(React.createElement(Component));
      
      container.on("destroy", () => {
        try {
          root.unmount();
        } catch {}
      });
    }

    gl.registerComponentFactoryFunction("Bytecode", (container) => {
      mountReact(container, BytecodePanel);
    });
    gl.registerComponentFactoryFunction("Opcodes", (container) => {
      mountReact(container, OpcodesPanel);
    });
    gl.registerComponentFactoryFunction("Graph", (container) => {
      mountReact(container, GraphPanel);
    });

    const config: LayoutConfig = {
      root: {
        type: "stack",
        header: { show: "top" },
        content: [
          { type: "component", componentType: "Bytecode", title: "Bytecode" },
          { type: "component", componentType: "Opcodes", title: "Opcodes" },
          { type: "component", componentType: "Graph", title: "Graph" },
        ],
      },
      settings: {
        showPopoutIcon: false,
        showMaximiseIcon: false,
        responsiveMode: "none",
      },
      dimensions: {
        headerHeight: 28,
        borderWidth: 5,
        minItemWidth: 150,
        minItemHeight: 120,
      },
      header: {
        show: "top",
      },
    };

    gl.loadLayout(config);

    function onResize() {
      if (!containerRef.current) return;
      gl.updateSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }
    window.addEventListener("resize", onResize);
    // Initial size update
    onResize();

    glRef.current = gl;
    layoutManager.setLayout(gl);

    return () => {
      window.removeEventListener("resize", onResize);
      gl.destroy();
      glRef.current = null;
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col">
      <MenuBar 
        layoutManager={layoutManager}
      />
      <div id="gl-container" ref={containerRef} className="flex-1" />
      <StatusBar status="Ready" />
      <DebugPanel />
    </div>
  );
}

export default App;
