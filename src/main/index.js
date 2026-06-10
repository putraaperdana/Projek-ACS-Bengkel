import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {
  completeRepair,
  getKendaraan,
  getCategories,
  getSukuByKategori,
  getReports,
  login,
  addSukuCadang,
  addKendaraan,
  updateKendaraanStatus,
  getMechanics,
  getKendaraanForMekanik,
  getAssignedRepairByVehicle,
  assignRepair,
  addLogPerbaikan,
  deleteKendaraan
} from './model'
import fs from 'fs'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Maintenance system handlers
  ipcMain.handle('completeRepair', completeRepair)
  ipcMain.handle('getKendaraan', getKendaraan)
  ipcMain.handle('getKendaraanForMekanik', getKendaraanForMekanik)
  ipcMain.handle('getCategories', getCategories)
  ipcMain.handle('getSukuByKategori', getSukuByKategori)
  ipcMain.handle('getReports', getReports)
  ipcMain.handle('login', login)
  ipcMain.handle('getMechanics', getMechanics)
  ipcMain.handle('assignRepair', assignRepair)
  ipcMain.handle('getAssignedRepairByVehicle', getAssignedRepairByVehicle)
  ipcMain.handle('addSukuCadang', addSukuCadang)
  ipcMain.handle('addKendaraan', addKendaraan)
  ipcMain.handle('updateKendaraanStatus', updateKendaraanStatus)
  ipcMain.handle('addLogPerbaikan', addLogPerbaikan)
  ipcMain.handle('deleteKendaraan', deleteKendaraan)

  ipcMain.handle('printPDF', async (event) => {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Save report',
      defaultPath: 'report.pdf'
    })

    if (canceled || !savePath) {
      return { success: false, canceled: true }
    }

    const win = BrowserWindow.fromWebContents(event.sender)
    try {
      const data = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
      await fs.promises.writeFile(savePath, data)
      return { success: true, path: savePath }
    } catch (err) {
      const message = err?.message || 'Failed to generate PDF'
      const locked = err?.code === 'EBUSY' || err?.code === 'EPERM' || err?.code === 'EACCES'
      if (locked) {
        return {
          success: false,
          canceled: false,
          error: `File sedang digunakan atau terkunci: ${savePath}. Tutup file tersebut dan coba lagi.`
        }
      }
      return { success: false, canceled: false, error: message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
