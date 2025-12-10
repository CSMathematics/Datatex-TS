import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Χρειάζεται: npm install uuid (και @types/uuid)
import { dbSchema } from './sql/schema';

export class DatabaseManager {
  private db: Database.Database | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'datatex_v2.db');
    console.log('--- DATABASE PATH:', dbPath);
    this.initDatabase(dbPath);
  }

  private initDatabase(dbPath: string) {
    try {
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON'); // Σημαντικό για το νέο σχήμα!

      // Εκτέλεση του σχήματος
      this.db.exec(dbSchema);

      // Seed βασικών δεδομένων (αν είναι άδεια)
      this.seedDefaults();
      
    } catch (error) {
      console.error('Database Init Error:', error);
    }
  }

  private seedDefaults() {
    if (!this.db) return;
    
    // Έλεγχος και δημιουργία Default Field
    const fieldCount = this.db.prepare('SELECT count(*) as count FROM Fields').get() as {count: number};
    if (fieldCount.count === 0) {
        console.log('Seeding default Field...');
        this.db.prepare('INSERT INTO Fields (Id, Name) VALUES (?, ?)').run('field-universal', 'Universal');
    }

    // Έλεγχος και δημιουργία Default FileType
    const typeCount = this.db.prepare('SELECT count(*) as count FROM FileTypes').get() as {count: number};
    if (typeCount.count === 0) {
        console.log('Seeding default FileType...');
        this.db.prepare('INSERT INTO FileTypes (Id, Name, FolderName) VALUES (?, ?, ?)').run('type-tex', 'LaTeX File', 'tex_files');
    }
  }

  // --- PUBLIC API ---

  public getAllFiles() {
    if (!this.db) return [];
    // JOIN για να πάρουμε το Chapter Name μαζί με το αρχείο
    const sql = `
      SELECT 
        df.Id as id, 
        df.Path as title, 
        df.FileContent as content, 
        'tex' as type, 
        c.Name as chapter
      FROM Database_Files df
      LEFT JOIN Chapters_per_File cpf ON df.Id = cpf.File_Id
      LEFT JOIN Chapters c ON cpf.Chapter_Id = c.Id
      ORDER BY c.Name ASC, df.Path ASC
    `;
    return this.db.prepare(sql).all();
  }

  public createFile(fileData: { title: string; content: string; type: string; chapter: string }) {
    if (!this.db) return null;

    const fileId = uuidv4();
    const chapterName = fileData.chapter || 'Uncategorized';
    
    // Transaction γιατί πειράζουμε πολλούς πίνακες
    const createTx = this.db.transaction(() => {
        // 1. Βρες ή Φτιάξε το Chapter
        let chapterId: string;
        const existingChapter = this.db!.prepare('SELECT Id FROM Chapters WHERE Name = ?').get(chapterName) as {Id: string} | undefined;
        
        if (existingChapter) {
            chapterId = existingChapter.Id;
        } else {
            chapterId = uuidv4();
            this.db!.prepare('INSERT INTO Chapters (Id, Name, Field) VALUES (?, ?, ?)')
                    .run(chapterId, chapterName, 'field-universal'); // Default field
        }

        // 2. Εισαγωγή Αρχείου
        this.db!.prepare(`
            INSERT INTO Database_Files (Id, Path, FileContent, FileType, Field) 
            VALUES (?, ?, ?, ?, ?)
        `).run(fileId, fileData.title, fileData.content, 'type-tex', 'field-universal');

        // 3. Σύνδεση Αρχείου με Chapter
        this.db!.prepare('INSERT INTO Chapters_per_File (File_Id, Chapter_Id) VALUES (?, ?)').run(fileId, chapterId);
    });

    try {
        createTx();
        return { id: fileId, ...fileData };
    } catch (e) {
        console.error('Create File Failed:', e);
        throw e;
    }
  }

  public updateFile(id: string, content: string) {
    if (!this.db) return false;
    const stmt = this.db.prepare('UPDATE Database_Files SET FileContent = ? WHERE Id = ?');
    const info = stmt.run(content, id);
    return info.changes > 0;
  }

  public deleteFile(id: string) {
    if (!this.db) return false;
    // Λόγω του ON DELETE CASCADE στο schema, θα διαγραφεί αυτόματα και από το Chapters_per_File
    const stmt = this.db.prepare('DELETE FROM Database_Files WHERE Id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  }
}