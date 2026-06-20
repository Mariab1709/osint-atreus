import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'server/db.json');

export interface UserRow {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
}

export interface ScanRow {
  id: string;
  userId: string;
  query: string;
  entityType: string;
  riskScore: number;
  timestamp: string;
  data: unknown;
}

export interface CaseRow {
  id: string;
  userId: string;
  entityName: string;
  entityTypeLabel: string;
  riskScore: number;
  status: 'En revisión' | 'Sospechoso' | 'Cerrado' | 'Seguro';
  notes: string;
  updatedAt: string;
  data: unknown;
}

interface DbSchema {
  users: UserRow[];
  scans: ScanRow[];
  cases: CaseRow[];
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  private initDb() {
    if (!fs.existsSync(DB_PATH)) {
      const initialData: DbSchema = {
        users: [],
        scans: [],
        cases: []
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    }
  }

  private readDb(): DbSchema {
    this.initDb();
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data) as DbSchema;
    } catch (err) {
      this.logger.error('Error al leer base de datos JSON. Re-inicializando:', err);
      const initialData: DbSchema = { users: [], scans: [], cases: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
  }

  private writeDb(data: DbSchema) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  // --- Operaciones de Usuarios ---

  public getUsers(): UserRow[] {
    return this.readDb().users;
  }

  public getUserByUsername(username: string): UserRow | undefined {
    return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserById(id: string): UserRow | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  public createUser(username: string, passwordHash: string, salt: string): UserRow {
    const db = this.readDb();
    const newUser: UserRow = {
      id: Math.random().toString(36).substring(2, 11),
      username,
      passwordHash,
      salt
    };
    db.users.push(newUser);
    this.writeDb(db);
    return newUser;
  }

  // --- Operaciones de Historial (Scans) ---

  public getScansByUserId(userId: string): ScanRow[] {
    return this.readDb().scans
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addScan(userId: string, query: string, entityType: string, riskScore: number, data: unknown): ScanRow {
    const db = this.readDb();
    const newScan: ScanRow = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      query,
      entityType,
      riskScore,
      timestamp: new Date().toISOString(),
      data
    };
    db.scans.push(newScan);

    // Mantener historial acotado a los últimos 50 escaneos por usuario
    const userScans = db.scans.filter(s => s.userId === userId);
    if (userScans.length > 50) {
      userScans.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const scansToRemove = userScans.slice(0, userScans.length - 50);
      db.scans = db.scans.filter(s => !scansToRemove.some(r => r.id === s.id));
    }

    this.writeDb(db);
    return newScan;
  }

  // --- Operaciones de Casos ---

  public getCasesByUserId(userId: string): CaseRow[] {
    return this.readDb().cases.filter(c => c.userId === userId);
  }

  public addCase(
    userId: string,
    entityName: string,
    entityTypeLabel: string,
    riskScore: number,
    notes: string,
    data: unknown
  ): CaseRow {
    const db = this.readDb();

    // Evitar duplicar casos
    const existingIdx = db.cases.findIndex(c => c.userId === userId && c.entityName.toLowerCase() === entityName.toLowerCase());

    if (existingIdx !== -1) {
      db.cases[existingIdx] = {
        ...db.cases[existingIdx],
        riskScore,
        notes: notes || db.cases[existingIdx].notes,
        updatedAt: new Date().toISOString(),
        data
      };
      this.writeDb(db);
      return db.cases[existingIdx];
    }

    const newCase: CaseRow = {
      id: Math.random().toString(36).substring(2, 11),
      userId,
      entityName,
      entityTypeLabel,
      riskScore,
      status: 'En revisión',
      notes,
      updatedAt: new Date().toISOString(),
      data
    };
    db.cases.push(newCase);
    this.writeDb(db);
    return newCase;
  }

  public updateCase(
    userId: string,
    caseId: string,
    updates: Partial<Pick<CaseRow, 'status' | 'notes'>>
  ): CaseRow | undefined {
    const db = this.readDb();
    const idx = db.cases.findIndex(c => c.id === caseId && c.userId === userId);

    if (idx === -1) return undefined;

    db.cases[idx] = {
      ...db.cases[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.writeDb(db);
    return db.cases[idx];
  }

  public deleteCase(userId: string, caseId: string): boolean {
    const db = this.readDb();
    const initialLen = db.cases.length;
    db.cases = db.cases.filter(c => !(c.id === caseId && c.userId === userId));
    this.writeDb(db);
    return db.cases.length < initialLen;
  }
}
