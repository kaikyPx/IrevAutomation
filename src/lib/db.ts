import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'src/data/subb.db');

// Garante que o diretório exista
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// INICIALIZA AS TABELAS
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    brand TEXT NOT NULL,
    house TEXT NOT NULL,
    source TEXT NOT NULL,
    currency TEXT NOT NULL,
    
    -- Valores Acumulados Hoje
    today_regs INTEGER DEFAULT 0,
    today_ftds INTEGER DEFAULT 0,
    today_cpa INTEGER DEFAULT 0,
    today_deps REAL DEFAULT 0,
    today_ngr REAL DEFAULT 0,
    
    -- Diferenças (Deltas)
    diff_regs INTEGER DEFAULT 0,
    diff_ftds INTEGER DEFAULT 0,
    diff_cpa INTEGER DEFAULT 0,
    diff_deps REAL DEFAULT 0,
    diff_ngr REAL DEFAULT 0,
    
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, brand, house, source)
  );

  CREATE TABLE IF NOT EXISTS cron_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    status TEXT,
    records_count INTEGER,
    message TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    affiliate_id TEXT NOT NULL,
    house TEXT NOT NULL,
    source TEXT NOT NULL,
    last_regs INTEGER DEFAULT 0,
    last_ftds INTEGER DEFAULT 0,
    last_cpa INTEGER DEFAULT 0,
    last_deps REAL DEFAULT 0,
    last_ngr REAL DEFAULT 0,
    reference_month TEXT NOT NULL, -- Ex: "2026-04"
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(affiliate_id, house, source)
  );

  CREATE INDEX IF NOT EXISTS idx_history_date ON history(date);
  CREATE INDEX IF NOT EXISTS idx_history_source ON history(source);
  CREATE INDEX IF NOT EXISTS idx_sync_state_key ON sync_state(affiliate_id, house, source);
`);

export function saveHistoryEntry(data: any) {
    const upsert = db.prepare(`
        INSERT INTO history (
            date, brand, house, source, currency,
            today_regs, today_ftds, today_cpa, today_deps, today_ngr,
            diff_regs, diff_ftds, diff_cpa, diff_deps, diff_ngr,
            updated_at
        ) VALUES (
            @date, @brand, @house, @source, @currency,
            @today_regs, @today_ftds, @today_cpa, @today_deps, @today_ngr,
            @diff_regs, @diff_ftds, @diff_cpa, @diff_deps, @diff_ngr,
            @updated_at
        )
        ON CONFLICT(date, brand, house, source) DO UPDATE SET
            today_regs = excluded.today_regs,
            today_ftds = excluded.today_ftds,
            today_cpa = excluded.today_cpa,
            today_deps = excluded.today_deps,
            today_ngr = excluded.today_ngr,
            diff_regs = excluded.diff_regs,
            diff_ftds = excluded.diff_ftds,
            diff_cpa = excluded.diff_cpa,
            diff_deps = excluded.diff_deps,
            diff_ngr = excluded.diff_ngr,
            updated_at = excluded.updated_at
    `);

    return upsert.run(data);
}

export function getHistoryByDate(date: string) {
    return db.prepare('SELECT * FROM history WHERE date = ?').all(date);
}

export function saveCronLog(log: any) {
    const insert = db.prepare(`
        INSERT INTO cron_logs (date, start_time, end_time, status, records_count, message)
        VALUES (@date, @start_time, @end_time, @status, @records_count, @message)
    `);
    return insert.run(log);
}

export function getSyncState(affiliateId: string, house: string, source: string) {
    return db.prepare('SELECT * FROM sync_state WHERE affiliate_id = ? AND house = ? AND source = ?')
             .get(affiliateId, house, source) as any;
}

export function updateSyncState(data: any) {
    const upsert = db.prepare(`
        INSERT INTO sync_state (
            affiliate_id, house, source, 
            last_regs, last_ftds, last_cpa, last_deps, last_ngr, 
            reference_month, updated_at
        ) VALUES (
            @affiliate_id, @house, @source, 
            @last_regs, @last_ftds, @last_cpa, @last_deps, @last_ngr, 
            @reference_month, CURRENT_TIMESTAMP
        )
        ON CONFLICT(affiliate_id, house, source) DO UPDATE SET
            last_regs = excluded.last_regs,
            last_ftds = excluded.last_ftds,
            last_cpa = excluded.last_cpa,
            last_deps = excluded.last_deps,
            last_ngr = excluded.last_ngr,
            reference_month = excluded.reference_month,
            updated_at = CURRENT_TIMESTAMP
    `);
    return upsert.run(data);
}
