import {ICalendarDB} from '../../domain/interfaces/ICalendarDB';
import {Calendar} from '../../domain/entities/Calendar';
import {Appointment} from '../../domain/entities/Appointment';
import {RecurrentAppointment} from '../../domain/entities/ReccurentAppointment';
import {Database} from 'better-sqlite3';
import {v4 as uuidv4} from 'uuid';

export class SQLiteCalendarDB implements ICalendarDB {
    private db: Database;

    constructor(db: Database) {
        this.db = db;
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
            updates.push('color = ?');
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
        const stmt = this.db.prepare('DELETE FROM calendars WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

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

        return new Appointment(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate,
            appointment.endDate,
            appointment.ownerId,
            [],
            appointment.createdAt,
            appointment.updatedAt,
            appointment.updatedBy
        );
    }

    async createRecurrentAppointment(appointment: RecurrentAppointment): Promise<RecurrentAppointment> {
        const id = uuidv4();
        const stmt = this.db.prepare(`
            INSERT INTO recurrent_appointments (id, calendar_id, title, description, start_date, end_date, owner_id,
                                                recursion_rule, created_at, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate.toISOString(),
            appointment.endDate.toISOString(),
            appointment.ownerId,
            appointment.recursionRule,
            appointment.createdAt.toISOString(),
            appointment.updatedAt.toISOString(),
            appointment.updatedBy
        );

        return new RecurrentAppointment(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate,
            appointment.endDate,
            appointment.ownerId,
            [],
            appointment.recursionRule,
            appointment.createdAt,
            appointment.updatedAt,
            appointment.updatedBy
        );
    }

    async findAppointmentById(id: string): Promise<Appointment | null> {
        const stmt = this.db.prepare('SELECT * FROM appointments WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new Appointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            [],
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        );
    }

    async findRecurrentAppointmentById(id: string): Promise<RecurrentAppointment | null> {
        const stmt = this.db.prepare('SELECT * FROM recurrent_appointments WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) return null;

        return new RecurrentAppointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            [],
            row.recursion_rule,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        );
    }

    async findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        const stmt = this.db.prepare('SELECT * FROM appointments WHERE calendar_id = ? ORDER BY start_date');
        const rows = stmt.all(calendarId) as any[];

        return rows.map(row => new Appointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            [],
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        ));
    }

    async findRecurrentAppointmentsByCalendarId(calendarId: string): Promise<RecurrentAppointment[]> {
        const stmt = this.db.prepare('SELECT * FROM recurrent_appointments WHERE calendar_id = ? ORDER BY start_date');
        const rows = stmt.all(calendarId) as any[];

        return rows.map(row => new RecurrentAppointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            [],
            row.recursion_rule,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
        ));
    }

    async updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
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
        if (appointment.updatedBy !== undefined) {
            updates.push('updated_by = ?');
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
        const stmt = this.db.prepare('DELETE FROM appointments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    async deleteRecurrentAppointment(id: string): Promise<boolean> {
        const stmt = this.db.prepare('DELETE FROM recurrent_appointments WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
}