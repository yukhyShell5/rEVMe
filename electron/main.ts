import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.commandLine.appendSwitch('no-sandbox');


// The built directory structure
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 1200,
    height: 800,
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }

  setupMenu(win);
}

function setupMenu(window: BrowserWindow) {
  const sendAction = (action: string) => {
    if (window && !window.isDestroyed()) {
      window.webContents.send('menu-action', action)
    }
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Export Disassembly (.txt)', click: () => sendAction('exportDisasm') },
        { label: 'Export Decompiled (.sol)', click: () => sendAction('exportDecompiled') },
        { label: 'Export Report (.json)', click: () => sendAction('exportReport') },
        { type: 'separator' },
        { label: 'Load Sample ERC-20', click: () => sendAction('loadSample') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Console', accelerator: 'CmdOrCtrl+`', click: () => sendAction('toggleConsole') },
        { type: 'separator' },
        { label: 'Disassembly', accelerator: 'CmdOrCtrl+1', click: () => sendAction('viewDisasm') },
        { label: 'Decompiled', accelerator: 'CmdOrCtrl+2', click: () => sendAction('viewDecompile') },
        { label: 'Control Flow', accelerator: 'CmdOrCtrl+3', click: () => sendAction('viewCfg') },
        { label: 'Storage', accelerator: 'CmdOrCtrl+4', click: () => sendAction('viewStorage') },
        { label: 'Strings', accelerator: 'CmdOrCtrl+5', click: () => sendAction('viewStrings') },
        { type: 'separator' },
        { label: 'Custom Queries', accelerator: 'CmdOrCtrl+6', click: () => sendAction('viewQueries') }
      ]
    },
    {
      label: 'Analysis',
      submenu: [
        { label: 'Re-analyze Contract', click: () => sendAction('analyzeContract') },
        { type: 'separator' },
        { label: 'Set API Key', click: () => sendAction('openApiKeyModal') }
      ]
    },
    {
      label: 'Search',
      submenu: [
        { label: 'Find in Disassembly', accelerator: 'CmdOrCtrl+F', click: () => sendAction('openSearch') },
        { label: 'Go to Offset', accelerator: 'CmdOrCtrl+G', click: () => sendAction('openGoto') }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Switch Network', click: () => sendAction('cycleNetwork') },
        { label: 'Load ABI File', click: () => sendAction('loadABI') }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
