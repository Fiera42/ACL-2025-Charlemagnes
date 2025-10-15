import { IShareDB } from '../../domain/interfaces/IShareDB';
import { Share } from '../../domain/entities/Share';
import { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteShareDB implements IShareDB {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async createShare(share: Share): Promise<Share> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO shares (id, owner_id, calendar_id, user_share_id, type_share, link_share, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            share.ownerId,
            share.calendarId,
            share.userShareId,
            share.typeShare,
            share.linkShare,
            share.createdAt.toISOString()
        );

        return new Share(
            id,
            share.ownerId,
            share.calendarId,
            share.userShareId,
            share.typeShare,
            share.linkShare,
            share.createdAt
        );
    }

    async findShareById(id: string): Promise<Share | null> {
        const stmt = this.db.prepare('SELECT * FROM shares WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share,
            row.link_share,
            new Date(row.created_at)
        );
    }

    async findSharesByCalendarId(calendarId: string): Promise<Share[]> {
        const stmt = this.db.prepare('SELECT * FROM shares WHERE calendar_id = ?');
        const rows = stmt.all(calendarId) as any[];

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async findSharesByUserId(userId: string): Promise<Share[]> {
        const stmt = this.db.prepare('SELECT * FROM shares WHERE user_share_id = ?');
        const rows = stmt.all(userId) as any[];

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async findSharesByOwner(ownerId: string): Promise<Share[]> {
        const stmt = this.db.prepare('SELECT * FROM shares WHERE owner_id = ?');
        const rows = stmt.all(ownerId) as any[];

        return rows.map(row => new Share(
            row.id,
            row.owner_id,
            row.calendar_id,
            row.user_share_id,
            row.type_share,
            row.link_share,
            new Date(row.created_at)
        ));
    }

    async deleteShare(id: string): Promise<boolean> {
        const stmt = this.db.prepare('DELETE FROM shares WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}