import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";
import "./index.css";
import { GoldenLayout, LayoutConfig } from "golden-layout";
import BytecodePanel from "./components/BytecodePanel";
import OpcodesPanel from "./components/OpcodesPanel";
import GraphPanel from "./components/GraphPanel";

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const glRef = useRef<GoldenLayout | null>(null);

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

    return () => {
      window.removeEventListener("resize", onResize);
      gl.destroy();
      glRef.current = null;
    };
  }, []);

  return <div id="gl-container" ref={containerRef} className="w-screen h-screen bg-gray-900" />;
}

export default App;
