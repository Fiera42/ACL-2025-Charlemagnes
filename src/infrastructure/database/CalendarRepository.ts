import { ICalendarDB } from '../../domain/interfaces/ICalendarDB';
      import { Calendar } from '../../domain/entities/Calendar';
      import { Appointment } from '../../domain/entities/Appointment';
      import { pool } from '../config/database';
      import { v4 as uuidv4 } from 'uuid';
      import { RowDataPacket, ResultSetHeader } from 'mysql2';

      export class CalendarRepository implements ICalendarDB {
        // Calendars
        async createCalendar(calendar: Calendar): Promise<Calendar> {
          const id = uuidv4();
          await pool.execute<ResultSetHeader>(
            'INSERT INTO calendars (id, name, description, color, owner_id, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, calendar.name, calendar.description, calendar.color, calendar.ownerId, calendar.createdAt, calendar.updatedAt, calendar.updatedBy]
          );

          return new Calendar(id, calendar.name, calendar.description, calendar.color, calendar.ownerId, calendar.createdAt, calendar.updatedAt, calendar.updatedBy);
        }

        async findCalendarById(id: string): Promise<Calendar | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM calendars WHERE id = ?',
            [id]
          );

          if (rows.length === 0) return null;

          const row = rows[0];
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
          const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM calendars WHERE owner_id = ?',
            [ownerId]
          );

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

          updates.push('updated_at = NOW()');
          values.push(id);

          await pool.execute(
            `UPDATE calendars SET ${updates.join(', ')} WHERE id = ?`,
            values
          );

          const updatedCalendar = await this.findCalendarById(id);
          if (!updatedCalendar) throw new Error('Calendrier introuvable');

          return updatedCalendar;
        }

        async deleteCalendar(id: string): Promise<boolean> {
          const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM calendars WHERE id = ?',
            [id]
          );

          return result.affectedRows > 0;
        }

        // Appointments
        async createAppointment(appointment: Appointment): Promise<Appointment> {
          const id = uuidv4();
          await pool.execute<ResultSetHeader>(
            'INSERT INTO appointments (id, calendar_id, title, description, start_date, end_date, owner_id, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, appointment.calendarId, appointment.title, appointment.description, appointment.startDate, appointment.endDate, appointment.ownerId, appointment.createdAt, appointment.updatedAt, appointment.updatedBy]
          );

          return new Appointment(
            id,
            appointment.calendarId,
            appointment.title,
            appointment.description,
            appointment.startDate,
            appointment.endDate,
            appointment.ownerId,
            appointment.createdAt,
            appointment.updatedAt,
            appointment.updatedBy
          );
        }

        async findAppointmentById(id: string): Promise<Appointment | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
          );

          if (rows.length === 0) return null;

          const row = rows[0];
          return new Appointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
            new Date(row.created_at),
            new Date(row.updated_at),
            row.updated_by
          );
        }

        async findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM appointments WHERE calendar_id = ? ORDER BY start_date',
            [calendarId]
          );

          return rows.map(row => new Appointment(
            row.id,
            row.calendar_id,
            row.title,
            row.description,
            new Date(row.start_date),
            new Date(row.end_date),
            row.owner_id,
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
            values.push(appointment.startDate);
          }
          if (appointment.endDate) {
            updates.push('end_date = ?');
            values.push(appointment.endDate);
          }
          if (appointment.updatedBy !== undefined) {
            updates.push('updated_by = ?');
            values.push(appointment.updatedBy);
          }

          updates.push('updated_at = NOW()');
          values.push(id);

          await pool.execute(
            `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
            values
          );

          const updatedAppointment = await this.findAppointmentById(id);
          if (!updatedAppointment) throw new Error('Rendez-vous introuvable');

          return updatedAppointment;
        }

        async deleteAppointment(id: string): Promise<boolean> {
          const [result] = await pool.execute<ResultSetHeader>(
            'DELETE FROM appointments WHERE id = ?',
            [id]
          );

          return result.affectedRows > 0;
        }
      }