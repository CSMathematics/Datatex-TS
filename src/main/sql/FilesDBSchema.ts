export const dbSchema = `
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "Fields" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL UNIQUE,
	"Description"	TEXT,
	PRIMARY KEY("Id")
);

CREATE TABLE IF NOT EXISTS "FileTypes" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL,
	"FolderName"	TEXT NOT NULL,
	"Solvable"	INTEGER,
	"BelongsTo"	TEXT,
	"Description"	TEXT,
	PRIMARY KEY("Id")
);

CREATE TABLE IF NOT EXISTS "Chapters" (
	"Id"	TEXT NOT NULL,
	"Name"	TEXT NOT NULL UNIQUE,
	"Field"	TEXT NOT NULL,
	PRIMARY KEY("Id"),
	FOREIGN KEY("Field") REFERENCES "Fields"("Id") ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Database_Files" (
	"Id"	TEXT NOT NULL,
	"FileType"	TEXT,
	"Field"	INTEGER,
	"Difficulty"	INTEGER,
	"Path"	TEXT NOT NULL,
	"Date"	TEXT,
	"Solved_Prooved"	TEXT,
	"Bibliography"	TEXT,
	"FileContent"	TEXT,
	"Preamble"	TEXT,
	"BuildCommand"	TEXT,
	"FileDescription"	TEXT,
	PRIMARY KEY("Id"),
	FOREIGN KEY("Field") REFERENCES "Fields"("Id") ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY("FileType") REFERENCES "FileTypes"("Id") ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Chapters_per_File" (
	"File_Id"	TEXT,
	"Chapter_Id"	TEXT,
	UNIQUE("File_Id","Chapter_Id"),
	FOREIGN KEY("Chapter_Id") REFERENCES "Chapters"("Id") ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY("File_Id") REFERENCES "Database_Files"("Id") ON UPDATE CASCADE ON DELETE CASCADE
);

-- Προσθέστε κι άλλους πίνακες εδώ αν χρειαστεί (Sections, Exercises, etc.)

COMMIT;
`;