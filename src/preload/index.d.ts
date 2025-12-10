import { ElectronAPI } from '@electron-toolkit/preload'

// Ορισμός της δομής του αρχείου
interface DBFile {
  id: number;
  title: string;
  content: string;
  type: string;
  chapter: string;
}

declare global {
  interface Window {
    // Δηλώνουμε ΟΛΕΣ τις συναρτήσεις που υπάρχουν στο preload/index.ts
    api: {
      getFiles: () => Promise<DBFile[]>;
      createFile: (file: Partial<DBFile>) => Promise<DBFile>;
      updateFile: (id: number, content: string) => Promise<boolean>;
      deleteFile: (id: number) => Promise<boolean>;
    }
  }
}