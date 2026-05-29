import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
   getDoctors: (searchName) => ipcRenderer.invoke('getDoctors', searchName),
   getDoctorReport: (doctorId) => ipcRenderer.invoke('getDoctorReport', doctorId),
   getMedicineReport: (medicineCode) => ipcRenderer.invoke('getMedicineReport', medicineCode),
   printPDF: () => ipcRenderer.invoke('printPDF')
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
