import { ICalendarDB } from '../../domain/interfaces/ICalendarDB';
import { Calendar } from '../../domain/entities/Calendar';
import { Appointment } from '../../domain/entities/Appointment';
import { RecurrentAppointment } from '../../domain/entities/ReccurentAppointment';
import { Database } from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { SQLiteTagDB } from './SQLiteTagDB';

export class SQLiteCalendarDB implements ICalendarDB {
    private db: Database;
    private tagDB: SQLiteTagDB;

    constructor(db: Database) {
        this.db = db;
        this.tagDB = new SQLiteTagDB(db);
    }

    // Calendars
    async createCalendar(calendar: Calendar): Promise<Calendar> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO calendars (id, name, description, color, owner_id, created_at, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            calendar.name,
            calendar.description,
            calendar.color,
            calendar.ownerId,
            calendar.createdAt.toISOString(),
            calendar.updatedAt.toISOString(),
            calendar.updatedBy
        );

        return new Calendar(
            id,
            calendar.name,
            calendar.description,
            calendar.color,
            calendar.ownerId,
            calendar.createdAt,
            calendar.updatedAt,
            calendar.updatedBy
        );
    }

    async findCalendarById(id: string): Promise<Calendar | null> {
        const stmt = this.db.prepare('SELECT * FROM calendars WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new Calendar(
            row.id,
            row.name,
            row.description,
            row.color,
            row.owner_id,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        );
    }

    async findCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
        const stmt = this.db.prepare('SELECT * FROM calendars WHERE owner_id = ?');
        const rows = stmt.all(ownerId) as any[];

        return rows.map(row => new Calendar(
            row.id,
            row.name,
            row.description,
            row.color,
            row.owner_id,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        ));
    }

    async updateCalendar(id: string, calendar: Partial<Calendar>): Promise<Calendar> {
        const updates: string[] = [];
        const values: any[] = [];

        if (calendar.name) {
            updates.push('name = ?');
            values.push(calendar.name);
        }
        if (calendar.description !== undefined) {
            updates.push('description = ?');
            values.push(calendar.description);
        }
        if (calendar.color) {
            updates.push('color = ? ');
            values.push(calendar.color);
        }
        if (calendar.updatedBy !== undefined) {
            updates.push('updated_by = ?');
            values.push(calendar.updatedBy);
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const stmt = this.db.prepare(`
            UPDATE calendars
            SET ${updates.join(', ')}
            WHERE id = ?
        `);
        stmt.run(...values);

        const updatedCalendar = await this.findCalendarById(id);
        if (!updatedCalendar) throw new Error('Calendrier introuvable');

        return updatedCalendar;
    }

    async deleteCalendar(id: string): Promise<boolean> {
        // Suppression des rendez-vous associés (les tags sont supprimés dans deleteAppointment)
        const appointments = await this.findAppointmentsByCalendarId(id);
        for (const appt of appointments) {
            if (appt.id) {
                await this.deleteAppointment(appt.id);
            }
        }

        // Suppression des rendez-vous récurrents associés (les tags sont supprimés dans deleteRecurrentAppointment)
        const recurrentAppointments = await this.findRecurrentAppointmentsByCalendarId(id);
        for (const appt of recurrentAppointments) {
            if (appt.id) {
                await this.deleteRecurrentAppointment(appt.id);
            }
        }

        const stmt = this.db.prepare('DELETE FROM calendars WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Appointments
    // Appointments
    async createAppointment(appointment: Appointment): Promise<Appointment> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
        INSERT INTO appointments (id, calendar_id, title, description, start_date, end_date, owner_id,
                                  created_at, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate.toISOString(),
            appointment.endDate.toISOString(),
            appointment.ownerId,
            appointment.createdAt.toISOString(),
            appointment.updatedAt.toISOString(),
            appointment.updatedBy
        );

        // Ajouter les tags associés
        if (appointment.tags && appointment.tags.length > 0) {
            await this.tagDB.addAllTagsToAppointment(id, appointment.tags);
        }

        return new Appointment(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate,
            appointment.endDate,
            appointment.ownerId,
            appointment.tags, // Retourner les tags
            appointment.createdAt,
            appointment.updatedAt,
            appointment.updatedBy
        );
    }

    async createRecurrentAppointment(appointment: RecurrentAppointment): Promise<RecurrentAppointment> {
        console.log('Creating recurrent appointment:', appointment);

        const id = uuidv4();
        const stmt = this.db.prepare(`
        INSERT INTO recurrent_appointments (id, calendar_id, title, description, start_date, end_date, owner_id,
                                            recursion_rule, recursion_end_date, created_at, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
    `);

        console.log('Confirmed');

        stmt.run(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate.toISOString(),
            appointment.endDate.toISOString(),
            appointment.ownerId,
            appointment.recursionRule,
            appointment.recursionEndDate.toISOString(),
            appointment.createdAt.toISOString(),
            appointment.updatedAt.toISOString(),
            appointment.updatedBy
        );

        // Ajouter les tags associés
        if (appointment.tags && appointment.tags.length > 0) {
            await this.tagDB.addAllTagsToRecurrentAppointment(id, appointment.tags);
        }

        return new RecurrentAppointment(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate,
            appointment.endDate,
            appointment.ownerId,
            appointment.tags, // Retourner les tags
            appointment.recursionRule,
            appointment.recursionEndDate,
            appointment.createdAt,
            appointment.updatedAt,
            appointment.updatedBy
        );
    }

    async findAppointmentById(id: string): Promise<Appointment | null> {
        const stmt = this.db.prepare(`
            SELECT 
                a.*,
                GROUP_CONCAT(at.tag_id) as tag_ids
            FROM appointments a
            LEFT JOIN appointment_tags at ON a.id = at.appointment_id
            WHERE a. id = ?
            GROUP BY a.id
        `);
        const row = stmt.get(id) as any;

        if (!row) return null;

        const tags = row.tag_ids ? row.tag_ids.split(',') : [];

        return new Appointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            tags,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        );
    }

    async findRecurrentAppointmentById(id: string): Promise<RecurrentAppointment | null> {
        const stmt = this.db.prepare(`
            SELECT 
                ra.*,
                GROUP_CONCAT(rat.tag_id) as tag_ids
            FROM recurrent_appointments ra
            LEFT JOIN recurrent_appointment_tags rat ON ra.id = rat.recurrent_appointment_id
            WHERE ra.id = ?
            GROUP BY ra.id
        `);
        const row = stmt.get(id) as any;

        if (!row) return null;

        const tags = row.tag_ids ? row.tag_ids.split(',') : [];

        return new RecurrentAppointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            tags,
            row.recursion_rule,
            new Date(row.recursion_end_date),
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        );
    }

    async findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        const stmt = this.db.prepare(`
            SELECT 
                a.*,
                GROUP_CONCAT(at. tag_id) as tag_ids
            FROM appointments a
            LEFT JOIN appointment_tags at ON a.id = at.appointment_id
            WHERE a.calendar_id = ?
            GROUP BY a.id
            ORDER BY a.start_date
        `);
        const rows = stmt.all(calendarId) as any[];

        return rows.map(row => {
            const tags = row.tag_ids ? row.tag_ids.split(',') : [];
            return new Appointment(
                row.id,
                row.calendar_id,
                row.title,
                row.description,
                new Date(row.start_date),
                new Date(row.end_date),
                row.owner_id,
                tags,
                new Date(row.created_at),
                new Date(row.updated_at),
                row.updated_by
            );
        });
    }

    async findRecurrentAppointmentsByCalendarId(calendarId: string): Promise<RecurrentAppointment[]> {
        const stmt = this.db.prepare(`
            SELECT 
                ra.*,
                GROUP_CONCAT(rat. tag_id) as tag_ids
            FROM recurrent_appointments ra
            LEFT JOIN recurrent_appointment_tags rat ON ra. id = rat.recurrent_appointment_id
            WHERE ra. calendar_id = ? 
            GROUP BY ra.id
            ORDER BY ra.start_date
        `);
        const rows = stmt.all(calendarId) as any[];

        return rows.map(row => {
            const tags = row.tag_ids ? row.tag_ids.split(',') : [];
            return new RecurrentAppointment(
                row.id,
                row.calendar_id,
                row.title,
                row.description,
                new Date(row.start_date),
                new Date(row.end_date),
                row.owner_id,
                tags,
                row.recursion_rule,
                new Date(row.recursion_end_date),
                new Date(row.created_at),
                new Date(row.updated_at),
                row.updated_by
            );
        });
    }

    async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
        const updates: string[] = [];
        const values: any[] = [];

        if (appointment.title) {
            updates.push('title = ? ');
            values.push(appointment.title);
        }
        if (appointment.description !== undefined) {
            updates.push('description = ?');
            values.push(appointment.description);
        }
        if (appointment.startDate) {
            updates.push('start_date = ?');
            values.push(appointment.startDate.toISOString());
        }
        if (appointment.endDate) {
            updates.push('end_date = ?');
            values.push(appointment.endDate.toISOString());
        }
        if (appointment.updatedBy !== undefined) {
            updates.push('updated_by = ?');
            values.push(appointment.updatedBy);
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const stmt = this.db.prepare(`
            UPDATE appointments
            SET ${updates.join(', ')}
            WHERE id = ? 
        `);
        stmt.run(...values);

        const updatedAppointment = await this.findAppointmentById(id);
        if (!updatedAppointment) throw new Error('Rendez-vous introuvable');

        return updatedAppointment;
    }

    async updateRecurrentAppointment(id: string, appointment: Partial<RecurrentAppointment>): Promise<RecurrentAppointment> {
        const updates: string[] = [];
        const values: any[] = [];

        if (appointment.title) {
            updates.push('title = ?');
            values.push(appointment.title);
        }
        if (appointment.description !== undefined) {
            updates.push('description = ?');
            values.push(appointment.description);
        }
        if (appointment.startDate) {
            updates.push('start_date = ?');
            values.push(appointment.startDate.toISOString());
        }
        if (appointment.endDate) {
            updates.push('end_date = ?');
            values.push(appointment.endDate.toISOString());
        }
        if (appointment.recursionRule !== undefined && appointment.recursionRule !== null) {
            updates.push('recursion_rule = ?');
            values.push(appointment.recursionRule);
        }
        if (appointment.recursionEndDate !== undefined && appointment.recursionEndDate !== null) {
            updates.push('recursion_end_date = ?');
            values.push(appointment.recursionEndDate.toISOString());
        }
        if (appointment.updatedBy !== undefined) {
            updates.push('updated_by = ? ');
            values.push(appointment.updatedBy);
        }

        updates.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        const stmt = this.db.prepare(`
            UPDATE recurrent_appointments
            SET ${updates.join(', ')}
            WHERE id = ? 
        `);
        stmt.run(...values);

        const updatedAppointment = await this.findRecurrentAppointmentById(id);
        if (!updatedAppointment) throw new Error('Rendez-vous récurrent introuvable');

        return updatedAppointment;
    }

    async deleteAppointment(id: string): Promise<boolean> {
        await this.tagDB.removeAllTagsFromAppointment(id);

        const stmt = this.db.prepare('DELETE FROM appointments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    async deleteRecurrentAppointment(id: string): Promise<boolean> {
        await this.tagDB.removeAllTagsFromRecurrentAppointment(id);

        const stmt = this.db.prepare('DELETE FROM recurrent_appointments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}