import { Calendar } from '../entities/Calendar';
import { Appointment } from '../entities/Appointment';
import { RecurrentAppointment } from '../entities/ReccurentAppointment';

export interface ICalendarDB {
  // Calendars
  createCalendar(calendar: Calendar): Promise<Calendar>;
  findCalendarById(id: string): Promise<Calendar | null>;
  findCalendarsByOwnerId(ownerId: string): Promise<Calendar[]>;
  updateCalendar(id: string, calendar: Partial<Calendar>): Promise<Calendar>;
  findCalendarsToUpdate(): Promise<Calendar[]>;
  deleteCalendar(id: string): Promise<boolean>;

  // export and import
  updatePublicToken(id: string, token: string | null): Promise<void>;
  findCalendarByPublicToken(token: string): Promise<Calendar | null>;

  // Appointments
  createAppointment(appointment: Appointment): Promise<Appointment>;
  findAppointmentById(id: string): Promise<Appointment | null>;
  findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]>;
  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<boolean>;

  deleteAllAppointmentsByCalendarId(calendarId: string): Promise<void>;

  // Recurrent Appointments
  createRecurrentAppointment(appointment: RecurrentAppointment): Promise<RecurrentAppointment>;
  findRecurrentAppointmentById(id: string): Promise<RecurrentAppointment | null>;
  findRecurrentAppointmentsByCalendarId(calendarId: string): Promise<RecurrentAppointment[]>;
  updateRecurrentAppointment(id: string, appointment: Partial<RecurrentAppointment>): Promise<RecurrentAppointment>;
  deleteRecurrentAppointment(id: string): Promise<boolean>;
}
