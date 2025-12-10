// infrastructure/db/SQLitePauseDB.ts
import { IPauseDB } from "../../domain/interfaces/IPauseDB";
import { Pause } from "../../domain/entities/Pause";
import { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

export class SQLitePauseDB implements IPauseDB {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async createPause(pause: Pause): Promise<Pause> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO pauses (id, recurrent_appointment_id, pause_start_date, pause_end_date, created_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            pause.recurrentAppointmentId,
            pause.pauseStartDate.toISOString(),
            pause.pauseEndDate.toISOString(),
            pause.createdAt.toISOString()
        );

        return new Pause(
            id,
            pause.recurrentAppointmentId,
            pause.pauseStartDate,
            pause.pauseEndDate,
            pause.createdAt
        );
    }

    async findPauseById(id: string): Promise<Pause | null> {
        const stmt = this.db.prepare(`SELECT * FROM pauses WHERE id = ?`);
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new Pause(
            row.id,
            row.recurrent_appointment_id,
            new Date(row.pause_start_date),
            new Date(row.pause_end_date),
            new Date(row.created_at)
        );
    }

    async findPausesByRecurrentAppointmentId(recurrentAppointmentId: string): Promise<Pause[]> {
        const stmt = this.db.prepare(`
            SELECT * FROM pauses WHERE recurrent_appointment_id = ?
        `);

        const rows = stmt.all(recurrentAppointmentId) as any[];

        return rows.map(row => new Pause(
            row.id,
            row.recurrent_appointment_id,
            new Date(row.pause_start_date),
            new Date(row.pause_end_date),
            new Date(row.created_at)
        ));
    }

    async update(pause: Pause): Promise<void> {
        const stmt = this.db.prepare(`
            UPDATE pauses
            SET pause_start_date = ?, pause_end_date = ?
            WHERE id = ?
        `);

        stmt.run(
            pause.pauseStartDate.toISOString(),
            pause.pauseEndDate.toISOString(),
            pause.id
        );
    }

    async deletePause(id: string): Promise<boolean> {
        const stmt = this.db.prepare(`DELETE FROM pauses WHERE id = ?`);
        const result = stmt.run(id);

        return result.changes > 0;
    }
}
