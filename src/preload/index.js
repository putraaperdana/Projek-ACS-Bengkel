import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  printPDF: () => ipcRenderer.invoke('printPDF')
}
// Maintenance system APIs
api.completeRepair = (payload) => ipcRenderer.invoke('completeRepair', payload);
api.getKendaraan = () => ipcRenderer.invoke('getKendaraan');
api.getCategories = () => ipcRenderer.invoke('getCategories');
api.getSukuByKategori = (kategori) => ipcRenderer.invoke('getSukuByKategori', kategori);
api.getReports = () => ipcRenderer.invoke('getReports');
api.login = (username, password) => ipcRenderer.invoke('login', username, password);
api.addSukuCadang = (payload) => ipcRenderer.invoke('addSukuCadang', payload);
api.addKendaraan = (payload) => ipcRenderer.invoke('addKendaraan', payload);
api.addLogPerbaikan = (payload) => ipcRenderer.invoke('addLogPerbaikan', payload);
api.deleteKendaraan = (nomor_polisi) => ipcRenderer.invoke('deleteKendaraan', nomor_polisi);

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
