import { Appointment } from "../entities/Appointment";
import { CalendarServiceResponse } from "../entities/CalendarServiceResponse";
import { RecurrentAppointment } from "../entities/ReccurentAppointment";
import { RecursionRule } from "../entities/RecursionRule";

export interface IAppointmentService {
  createAppointment(
    ownerId: string,
    calendarId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment>;

  createRecurrentAppointment(
    ownerId: string,
    calendarId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    recursionRule: RecursionRule
  ): Promise<RecurrentAppointment>;

  deleteAppointment(
    ownerId: string,
    appointmentId: string
  ): Promise<CalendarServiceResponse>;

  updateAppointment(
    ownerId: string,
    appointmentId: string,
    appointment: Partial<Appointment>
  ): Promise<CalendarServiceResponse>;

  updateRecurrentAppointment(
    ownerId: string,
    appointmentId: string,
    appointment: Partial<RecurrentAppointment>
  ): Promise<CalendarServiceResponse>;

  shareAppointment(
    ownerId: string,
    appointmentId: string,
    sharedToId: string
  ): Promise<CalendarServiceResponse>;

  unShareAppointment(
    ownerId: string,
    appointmentId: string,
    sharedToId: string
  ): Promise<CalendarServiceResponse>;

  getAppointmentById(id: string): Promise<Appointment | null>;

  getAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]>;

  getConflictsOfUser(
    ownerId: string
  ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]>;

  getConflictsOfCalendar(
    calendarId: string
  ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]>;
}
