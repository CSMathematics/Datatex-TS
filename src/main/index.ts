import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseManager } from './database'

// Κρατάμε το instance της βάσης σε global μεταβλητή για να μην χαθεί
let dbManager: DatabaseManager

function createWindow(): void {
  // Το path για το preload script
  const preloadPath = join(__dirname, '../preload/index.js')

  console.log('--- MAIN: Creating Window ---')
  console.log('--- PRELOAD PATH:', preloadPath)

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadPath,
      sandbox: false, // ΑΠΑΡΑΙΤΗΤΟ για να τρέξει η SQLite (native modules)
      contextIsolation: true, // ΑΣΦΑΛΕΙΑ: Πρέπει να είναι true για το bridge
      nodeIntegration: false // ΑΣΦΑΛΕΙΑ: Πρέπει να είναι false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Άνοιγμα DevTools σε development mode για debugging
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // Φόρτωση URL (Dev) ή Αρχείου (Prod)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- APP LIFECYCLE ---

app.whenReady().then(() => {
  // Set app ID for Windows
  electronApp.setAppUserModelId('com.datatex.ide')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 1. Αρχικοποίηση Βάσης Δεδομένων
  try {
    // Βεβαιώσου ότι το αρχείο database.ts υπάρχει και εξάγει την κλάση σωστά
    dbManager = new DatabaseManager()
    console.log('--- MAIN: Database Initialized Successfully ---')
  } catch (error) {
    console.error('--- MAIN: Database FATAL ERROR ---', error)
  }

  // 2. Ρύθμιση IPC Handlers (Η "Γέφυρα" με το React)
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// --- IPC HANDLERS ---

function setupIpcHandlers() {
  // Λήψη όλων των αρχείων
  ipcMain.handle('get-files', () => {
    console.log('--- IPC: UI requested files ---')
    if (!dbManager) return []
    try {
      const files = dbManager.getAllFiles()
      return files
    } catch (e) {
      console.error('IPC get-files Error:', e)
      return []
    }
  })

  // Δημιουργία νέου αρχείου
  ipcMain.handle('create-file', (_, fileData) => {
    console.log('--- IPC: Creating file ---', fileData.title)
    if (!dbManager) return null
    try {
      // Υποθέτουμε ότι η μέθοδος επιστρέφει το ID ή το αντικείμενο του νέου αρχείου
      return dbManager.createFile(fileData)
    } catch (e) {
      console.error('IPC create-file Error:', e)
      throw e
    }
  })

  // Ενημέρωση περιεχομένου (Save)
  ipcMain.handle('update-file', (_, id, content) => {
    console.log(`--- IPC: Updating file ${id} ---`)
    if (!dbManager) return false
    try {
      dbManager.updateFile(id, content)
      return true
    } catch (e) {
      console.error('IPC update-file Error:', e)
      throw e
    }
  })

  // Διαγραφή αρχείου
  ipcMain.handle('delete-file', (_, id) => {
    console.log(`--- IPC: Deleting file ${id} ---`)
    if (!dbManager) return false
    try {
      dbManager.deleteFile(id)
      return true
    } catch (e) {
      console.error('IPC delete-file Error:', e)
      throw e
    }
  })
}
