import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Ανάγνωση (υπήρχε ήδη)
  getFiles: () => ipcRenderer.invoke('get-files'),

  // --- ΟΙ ΝΕΕΣ ΕΝΤΟΛΕΣ ΠΟΥ ΧΡΕΙΑΖΕΣΑΙ ---

  // Δημιουργία: Στέλνει τα δεδομένα του νέου αρχείου
  createFile: (file) => ipcRenderer.invoke('create-file', file),

  // Ενημέρωση (Save): Στέλνει το ID και το νέο περιεχόμενο
  updateFile: (id, content) => ipcRenderer.invoke('update-file', id, content),

  // Διαγραφή: Στέλνει το ID του αρχείου προς διαγραφή
  deleteFile: (id) => ipcRenderer.invoke('delete-file', id),

  // Μεταγλώττιση: Στέλνει το περιεχόμενο Latex για compilation
  compileFile: (content) => ipcRenderer.invoke('compile-file', content)
}

// Use `contextBridge` APIs to expose IPC to the renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (fallback if context isolation is disabled)
  window.api = api
}
