import { useCallback, useRef } from "react";
import { GoldenLayout } from "golden-layout";

export interface PanelState {
  bytecode: boolean;
  opcodes: boolean;
  graph: boolean;
}

export const useLayoutManager = () => {
  const layoutRef = useRef<GoldenLayout | null>(null);

  const setLayout = useCallback((layout: GoldenLayout) => {
    layoutRef.current = layout;
  }, []);

  const resetLayout = useCallback(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    try {
      // Force a complete refresh by destroying and recreating
      window.location.reload();
    } catch (error) {
      console.error("Error resetting layout:", error);
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }, []);

  return {
    setLayout,
    resetLayout,
    enterFullscreen,
  };
};

export default useLayoutManager;
