import { CalendarRepository } from '../../domain/repositories/CalendarRepository';
import { Calendar } from '../../domain/entities/Calendar';
import { db } from '../config/sqliteAdapter';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteCalendarRepository implements CalendarRepository {
    async save(calendar: Calendar): Promise<Calendar> {
        const id = calendar.id || uuidv4();
        const stmt = db.prepare(`
            INSERT INTO calendars (id, name, description, color, owner_id, created_at, updated_at, url, update_rule)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            id,
            calendar.name,
            calendar.description,
            calendar.color,
            calendar.ownerId,
            calendar.createdAt.toISOString(),
            calendar.updatedAt.toISOString(),
            calendar.url,
            calendar.updateRule
        );

        return new Calendar(
            id,
            calendar.name,
            calendar.description,
            calendar.color,
            calendar.ownerId,
            calendar.createdAt,
            calendar.updatedAt,
            null,
            calendar.url,
            calendar.updateRule
        );
    }

    async findById(id: string): Promise<Calendar | null> {
        const row = db.prepare('SELECT * FROM calendars WHERE id = ?').get(id) as any;
        if (!row) return null;
        return this.mapToEntity(row);
    }

    async findAllByOwnerId(ownerId: string): Promise<Calendar[]> {
        const rows = db.prepare('SELECT * FROM calendars WHERE owner_id = ?').all(ownerId) as any[];
        return rows.map(this.mapToEntity);
    }

    async update(calendar: Calendar): Promise<Calendar> {
        const stmt = db.prepare(`
            UPDATE calendars 
            SET name = ?, description = ?, color = ?, updated_at = ?, updated_by = ?, url = ?, update_rule = ?
            WHERE id = ?
        `);
        
        stmt.run(
            calendar.name,
            calendar.description,
            calendar.color,
            new Date().toISOString(),
            calendar.updatedBy,
            calendar.url,
            calendar.updateRule,
            calendar.id
        );

        return calendar;
    }

    async delete(id: string): Promise<void> {
        db.prepare('DELETE FROM calendars WHERE id = ?').run(id);
    }

    async share(calendarId: string, userId: string): Promise<void> {
        const id = uuidv4();
        // Vérifier si le partage existe déjà
        const existing = db.prepare('SELECT id FROM shares WHERE calendar_id = ? AND user_share_id = ?').get(calendarId, userId);
        if (existing) return;

        // Récupérer le owner_id du calendrier
        const calendar = db.prepare('SELECT owner_id FROM calendars WHERE id = ?').get(calendarId) as any;
        if (!calendar) throw new Error("Calendrier introuvable");

        db.prepare(`
            INSERT INTO shares (id, owner_id, calendar_id, user_share_id, type_share)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, calendar.owner_id, calendarId, userId, 1); // 1 = READ_ONLY par défaut
    }

    async unshare(calendarId: string, userId: string): Promise<void> {
        db.prepare('DELETE FROM shares WHERE calendar_id = ? AND user_share_id = ?').run(calendarId, userId);
    }

    private mapToEntity(row: any): Calendar {
        return new Calendar(
            row.id,
            row.name,
            row.description,
            row.color,
            row.owner_id,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by,
            row.url,
            row.update_rule
        );
    }
}
