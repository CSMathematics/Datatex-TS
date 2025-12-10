/// <reference types="vite/client" />

// Ορισμός του DBFile καθολικά (δεν χρειάζεται import μετά)
interface DBFile {
  id: number
  title: string
  content: string
  type: string
  chapter: string
}

// Ορισμός του API
interface IElectronAPI {
  getFiles: () => Promise<DBFile[]>
  createFile: (file: Partial<DBFile>) => Promise<DBFile>
  updateFile: (id: number, content: string) => Promise<boolean>
  deleteFile: (id: number) => Promise<boolean>
}

// Επέκταση του Window object
interface Window {
  api: IElectronAPI
}
