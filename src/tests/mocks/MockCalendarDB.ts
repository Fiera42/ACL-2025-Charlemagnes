import { Appointment } from "../../domain/entities/Appointment";
import { Calendar } from "../../domain/entities/Calendar";
import { ICalendarDB } from "../../domain/interfaces/ICalendarDB";

export class MockCalendarDB implements ICalendarDB {
  calendars: { [id: string]: Calendar } = {};
  appointments: { [id: string]: Appointment } = {};

  createCalendar(calendar: Calendar): Promise<Calendar> {
    throw new Error("Method not implemented.");
  }

  findCalendarById(id: string): Promise<Calendar | null> {
    throw new Error("Method not implemented.");
  }

  findCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
    throw new Error("Method not implemented.");
  }

  updateCalendar(id: string, calendar: Partial<Calendar>): Promise<Calendar> {
    throw new Error("Method not implemented.");
  }

  deleteCalendar(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  createAppointment(appointment: Appointment): Promise<Appointment> {
    throw new Error("Method not implemented.");
  }

  findAppointmentById(id: string): Promise<Appointment | null> {
    throw new Error("Method not implemented.");
  }

  findAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
    throw new Error("Method not implemented.");
  }

  updateAppointment(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    throw new Error("Method not implemented.");
  }

  deleteAppointment(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
