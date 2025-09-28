import React, { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ThemeToggle from "./ThemeToggle";
import Dialog from "./Dialog";
import { useLayoutManager } from "../hooks/useLayoutManager";
import { appStore } from "../store/AppStore";

interface MenuBarProps {
  layoutManager?: ReturnType<typeof useLayoutManager>;
}

interface DropdownMenu {
  id: string;
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  separator?: boolean;
  action?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ layoutManager }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    if (isMaximized) {
      await appWindow.unmaximize();
      setIsMaximized(false);
    } else {
      await appWindow.maximize();
      setIsMaximized(true);
    }
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  const handleOpenBytecode = async () => {
    try {
      await appStore.loadBytecodeFile();
      console.log("Opened bytecode file");
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const handleShowAbout = () => {
    setShowAboutDialog(true);
  };

  const handleShowShortcuts = () => {
    setShowShortcutsDialog(true);
  };

  const handleResetLayout = () => {
    if (layoutManager) {
      layoutManager.resetLayout();
    }
  };

  const handleFullscreen = () => {
    if (layoutManager) {
      layoutManager.enterFullscreen();
    }
  };

  const handleToggleDebug = () => {
    appStore.toggleDebugPanel();
  };

  const menus: DropdownMenu[] = [
    {
      id: "file",
      label: "File",
      items: [
        { id: "open", label: "Open Bytecode", shortcut: "Ctrl+O", action: handleOpenBytecode },
        { id: "separator1", label: "", separator: true },
        { id: "exit", label: "Exit", shortcut: "Ctrl+Q", action: handleClose },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        { id: "bytecode", label: "Bytecode Panel", shortcut: "F1" },
        { id: "opcodes", label: "Opcodes Panel", shortcut: "F2" },
        { id: "graph", label: "Graph Panel", shortcut: "F3" },
        { id: "separator2", label: "", separator: true },
        { id: "fullscreen", label: "Toggle Fullscreen", shortcut: "F11", action: handleFullscreen },
      ],
    },
    {
      id: "windows",
      label: "Windows",
      items: [
        { id: "minimize", label: "Minimize", shortcut: "Ctrl+M", action: handleMinimize },
        { id: "maximize", label: "Maximize", action: handleMaximize },
        { id: "separator3", label: "", separator: true },
        { id: "debug", label: "Toggle Debug Panel", shortcut: "F12", action: handleToggleDebug },
        { id: "reset_layout", label: "Reset Layout", action: handleResetLayout },
      ],
    },
    {
      id: "help",
      label: "Help",
      items: [
        { id: "docs", label: "Documentation", shortcut: "F1" },
        { id: "shortcuts", label: "Keyboard Shortcuts", action: handleShowShortcuts },
        { id: "separator4", label: "", separator: true },
        { id: "about", label: "About rEVMe", action: handleShowAbout },
      ],
    },
  ];

  const handleMenuClick = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    }
    setActiveMenu(null);
  };

  const handleClickOutside = () => {
    setActiveMenu(null);
  };

  return (
    <>
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={handleClickOutside}
        />
      )}
      
      <div
        className="flex items-center justify-between h-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-600/50 text-white text-sm select-none relative z-20 shadow-lg"
        data-tauri-drag-region
      >
        <div className="flex items-center">
          <div className="flex items-center px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-r-lg mr-2">
            <svg className="w-4 h-4 mr-2 text-blue-400 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 text-sm tracking-wide">
              rEVMe
            </span>
          </div>

          {menus.map((menu) => (
            <div key={menu.id} className="relative">
              <button
                className={`px-3 py-1.5 rounded-md transition-all duration-200 text-gray-200 hover:text-white hover:bg-gray-700/70 hover:shadow-md ${
                  activeMenu === menu.id ? "bg-gray-700/90 text-white shadow-inner" : ""
                }`}
                onClick={() => handleMenuClick(menu.id)}
              >
                {menu.label}
              </button>

              {activeMenu === menu.id && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600/50 rounded-lg shadow-2xl z-30 backdrop-blur-sm">
                  <div className="py-1">
                    {menu.items.map((item) => (
                      <div key={item.id}>
                        {item.separator ? (
                          <div className="border-t border-gray-600/50 my-1" />
                        ) : (
                          <button
                            className="w-full px-4 py-2.5 text-left hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-purple-600/20 flex justify-between items-center transition-all duration-150 group text-gray-200 hover:text-white"
                            onClick={() => handleMenuItemClick(item)}
                          >
                            <span className="group-hover:translate-x-0.5 transition-transform">
                              {item.label}
                            </span>
                            {item.shortcut && (
                              <span className="text-xs text-gray-400 group-hover:text-gray-300 ml-4 bg-gray-700/50 px-2 py-0.5 rounded font-mono">
                                {item.shortcut}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gray-700/30 rounded-md p-1">
            <ThemeToggle />
          </div>
          
          <div className="w-px h-5 bg-gray-600/50"></div>
          
          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-gradient-to-br hover:from-gray-600 hover:to-gray-700 transition-all duration-200 rounded group"
            onClick={handleMinimize}
            title="Minimize"
          >
            <svg className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 12 12">
              <path d="M0 6h12v1H0z" />
            </svg>
          </button>

          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-gradient-to-br hover:from-gray-600 hover:to-gray-700 transition-all duration-200 rounded group"
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <svg className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 12 12">
                <path d="M2 2v8h8V2H2zm1 1h6v6H3V3z" />
                <path d="M1 1v2h1V2h1V1H1zM9 1v1h1v1h1V1H9z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 12 12">
                <path d="M1 1v10h10V1H1zm1 1h8v8H2V2z" />
              </svg>
            )}
          </button>

          <button
            className="w-8 h-8 flex items-center justify-center hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 transition-all duration-200 rounded group"
            onClick={handleClose}
            title="Close"
          >
            <svg className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 12 12">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        </div>
      </div>

      <Dialog
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
        title="About rEVMe"
        size="md"
      >
        <div className="space-y-4 text-gray-300">
          <div className="flex items-center space-x-3">
            <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
            </svg>
            <div>
              <h4 className="text-xl font-bold text-white">rEVMe</h4>
              <p className="text-blue-300">Reverse Engineering for EVM</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p><span className="font-semibold text-white">Version:</span> 0.1.0</p>
            <p><span className="font-semibold text-white">Built with:</span> Tauri + React + TypeScript</p>
            <p><span className="font-semibold text-white">Purpose:</span> Advanced EVM bytecode analysis tool</p>
          </div>
          
          <div className="pt-2 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              A professional tool for reverse engineering Ethereum Virtual Machine bytecode
              with advanced visualization and analysis capabilities.
            </p>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={showShortcutsDialog}
        onClose={() => setShowShortcutsDialog(false)}
        title="Keyboard Shortcuts"
        size="lg"
      >
        <div className="space-y-4 text-gray-300">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-white mb-2">File Operations</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Open Bytecode</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">Ctrl+O</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Exit</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">Ctrl+Q</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-white mb-2">View</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Bytecode Panel</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">F1</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Opcodes Panel</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">F2</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Graph Panel</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">F3</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Fullscreen</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">F11</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-white mb-2">Window</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Minimize</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">Ctrl+M</kbd>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-white mb-2">Help</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Documentation</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-xs font-mono">F1</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default MenuBar;
