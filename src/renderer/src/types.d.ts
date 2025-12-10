// Ορίζουμε τη μορφή των δεδομένων μας
export interface DBFile {
  id: number
  title: string
  content: string
  type: string
  chapter: string
}

// Ορίζουμε το API που έρχεται από το Preload
export interface IElectronAPI {
  getFiles: () => Promise<DBFile[]>
  createFile: (file: Partial<DBFile>) => Promise<DBFile>
  updateFile: (id: number, content: string) => Promise<boolean>
  deleteFile: (id: number) => Promise<boolean>
  compileFile: (content: string) => Promise<{ success: boolean; data?: string; logs: string }>
  getDbStats: () => Promise<{ files: number; chapters: number }>
}

export interface AppSettings {
  fontSize: number
  minimap: boolean
  wordWrap: boolean
  lineNumbers: boolean
}

// Επεκτείνουμε το global Window object
declare global {
  interface Window {
    api: IElectronAPI
  }
}
