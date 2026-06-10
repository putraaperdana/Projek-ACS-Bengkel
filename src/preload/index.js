import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer and maintenance system APIs
const api = {
  printPDF: () => ipcRenderer.invoke('printPDF'),
  completeRepair: (payload) => ipcRenderer.invoke('completeRepair', payload),
  getKendaraan: () => ipcRenderer.invoke('getKendaraan'),
  getCategories: () => ipcRenderer.invoke('getCategories'),
  getSukuByKategori: (kategori) => ipcRenderer.invoke('getSukuByKategori', kategori),
  getReports: () => ipcRenderer.invoke('getReports'),
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  addSukuCadang: (payload) => ipcRenderer.invoke('addSukuCadang', payload),
  addKendaraan: (payload) => ipcRenderer.invoke('addKendaraan', payload),
  updateKendaraanStatus: (payload) => ipcRenderer.invoke('updateKendaraanStatus', payload),
  getMechanics: () => ipcRenderer.invoke('getMechanics'),
  assignRepair: (payload) => ipcRenderer.invoke('assignRepair', payload),
  getKendaraanForMekanik: (id_user) => ipcRenderer.invoke('getKendaraanForMekanik', id_user),
  getAssignedRepairByVehicle: (payload) => ipcRenderer.invoke('getAssignedRepairByVehicle', payload),
  addLogPerbaikan: (payload) => ipcRenderer.invoke('addLogPerbaikan', payload),
  deleteKendaraan: (nomor_polisi) => ipcRenderer.invoke('deleteKendaraan', nomor_polisi)
}

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
