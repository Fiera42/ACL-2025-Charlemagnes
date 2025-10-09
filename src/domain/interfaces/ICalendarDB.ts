import { Calendar } from '../entities/Calendar';
import { Appointment } from '../entities/Appointment';

export interface ICalendarDB {
  // Calendars
  createCalendar(calendar: Calendar): Promise<Calendar>;
  findCalendarById(id: string): Promise<Calendar | null>;
  findCalendarsByOwnerId(ownerId: string): Promise<Calendar[]>;
  updateCalendar(id: string, calendar: Partial<Calendar>): Promise<Calendar>;
  deleteCalendar(id: string): Promise<boolean>;

  // Appointments
  createAppointment(appointment: Appointment): Promise<Appointment>;
  findAppointmentById(id: string): Promise<Appointment | null>;
  findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]>;
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<boolean>;
}