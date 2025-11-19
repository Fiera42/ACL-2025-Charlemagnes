import { ITagDB } from '../../domain/interfaces/ITagDB';
import { Tag } from '../../domain/entities/Tag';
import { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteTagDB implements ITagDB {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async createTag(tag: Tag): Promise<Tag> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO tags (id, name, color, created_by, created_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            tag.name,
            tag.color,
            tag.createdBy,
            tag.createdAt.toISOString()
        );

        return new Tag(id, tag.name, tag.color, tag.createdBy, tag.createdAt);
    }

    async findTagById(id: string): Promise<Tag | null> {
        const stmt = this.db.prepare('SELECT * FROM tags WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new Tag(
            row.id,
            row.name,
            row.color,
            row.created_by,
            new Date(row.created_at)
        );
    }

    async findTagsByUser(userId: string): Promise<Tag[]> {
        const stmt = this.db.prepare('SELECT * FROM tags WHERE created_by = ? ORDER BY name');
        const rows = stmt.all(userId) as any[];

        return rows.map(row => new Tag(
            row.id,
            row.name,
            row.color,
            row.created_by,
            new Date(row.created_at)
        ));
    }

    async updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
        const updates: string[] = [];
        const values: any[] = [];

        if (tag.name) {
            updates.push('name = ?');
            values.push(tag.name);
        }
        if (tag.color) {
            updates.push('color = ?');
            values.push(tag.color);
        }

        values.push(id);

        const stmt = this.db.prepare(`
            UPDATE tags
            SET ${updates.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);

        const updatedTag = await this.findTagById(id);
        if (!updatedTag) throw new Error('Tag introuvable');

        return updatedTag;
    }

    async deleteTag(id: string): Promise<boolean> {
        const deleteTagTx = this.db.transaction((tagId: string) => {
            this.db.prepare('DELETE FROM appointment_tags WHERE tag_id = ?').run(tagId);
            this.db.prepare('DELETE FROM recurrent_appointment_tags WHERE tag_id = ?').run(tagId);
            return this.db.prepare('DELETE FROM tags WHERE id = ?').run(tagId).changes > 0;
        });

        return deleteTagTx(id);
    }

    async addTagToAppointment(appointmentId: string, tagId: string): Promise<void> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO appointment_tags (id, appointment_id, tag_id, created_at)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(id, appointmentId, tagId, new Date().toISOString());
    }

    async removeTagFromAppointment(appointmentId: string, tagId: string): Promise<boolean> {
        const stmt = this.db.prepare(`
            DELETE FROM appointment_tags 
            WHERE appointment_id = ? AND tag_id = ?
        `);
        const result = stmt.run(appointmentId, tagId);
        return result.changes > 0;
    }

    async findTagsByAppointment(appointmentId: string): Promise<Tag[]> {
        const stmt = this.db.prepare(`
            SELECT t.* FROM tags t
            INNER JOIN appointment_tags at ON t.id = at.tag_id
            WHERE at.appointment_id = ?
            ORDER BY t.name
        `);
        const rows = stmt.all(appointmentId) as any[];

        return rows.map(row => new Tag(
            row.id,
            row.name,
            row.color,
            row.created_by,
            new Date(row.created_at)
        ));
    }

    async addTagToRecurrentAppointment(recurrentAppointmentId: string, tagId: string): Promise<void> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO recurrent_appointment_tags (id, recurrent_appointment_id, tag_id, created_at)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(id, recurrentAppointmentId, tagId, new Date().toISOString());
    }

    async removeTagFromRecurrentAppointment(recurrentAppointmentId: string, tagId: string): Promise<boolean> {
        const stmt = this.db.prepare(`
            DELETE FROM recurrent_appointment_tags 
            WHERE recurrent_appointment_id = ? AND tag_id = ?
        `);
        const result = stmt.run(recurrentAppointmentId, tagId);
        return result.changes > 0;
    }

    async findTagsByRecurrentAppointment(recurrentAppointmentId: string): Promise<Tag[]> {
        const stmt = this.db.prepare(`
            SELECT t.* FROM tags t
            INNER JOIN recurrent_appointment_tags rat ON t.id = rat.tag_id
            WHERE rat.recurrent_appointment_id = ?
            ORDER BY t.name
        `);
        const rows = stmt.all(recurrentAppointmentId) as any[];

        return rows.map(row => new Tag(
            row.id,
            row.name,
            row.color,
            row.created_by,
            new Date(row.created_at)
        ));
    }
}