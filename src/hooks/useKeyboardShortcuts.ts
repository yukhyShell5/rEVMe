import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  onOpenFile?: () => void;
  onExit?: () => void;
  onFullscreen?: () => void;
  onMinimize?: () => void;
  onToggleDebug?: () => void;
}

export const useKeyboardShortcuts = ({
  onOpenFile,
  onExit,
  onFullscreen,
  onMinimize,
  onToggleDebug,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      const { ctrlKey, key, altKey, shiftKey } = event;

      if (ctrlKey && key === 'o' && !altKey && !shiftKey) {
        event.preventDefault();
        onOpenFile?.();
      }

      if (ctrlKey && key === 'q' && !altKey && !shiftKey) {
        event.preventDefault();
        onExit?.();
      }

      if (key === 'F11' && !ctrlKey && !altKey && !shiftKey) {
        event.preventDefault();
        onFullscreen?.();
      }

      if (ctrlKey && key === 'm' && !altKey && !shiftKey) {
        event.preventDefault();
        onMinimize?.();
      }

      if (key === 'F12' && !ctrlKey && !altKey && !shiftKey) {
        event.preventDefault();
        onToggleDebug?.();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [onOpenFile, onExit, onFullscreen, onMinimize, onToggleDebug]);
};

export default useKeyboardShortcuts;
