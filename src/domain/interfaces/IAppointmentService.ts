import { Appointment } from "../entities/Appointment";
import { ServiceResponse } from "../entities/ServiceResponse.ts";
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
  ): Promise<ServiceResponse>;

  deleteRecurrentAppointment(
    ownerId: string,
    appointmentId: string
  ): Promise<ServiceResponse>;

  updateAppointment(
    ownerId: string,
    appointmentId: string,
    appointment: Partial<Appointment>
  ): Promise<ServiceResponse>;

  updateRecurrentAppointment(
    ownerId: string,
    appointmentId: string,
    appointment: Partial<RecurrentAppointment>
  ): Promise<ServiceResponse>;

  shareAppointment(
    ownerId: string,
    appointmentId: string,
    sharedToId: string
  ): Promise<ServiceResponse>;

  unShareAppointment(
    ownerId: string,
    appointmentId: string,
    sharedToId: string
  ): Promise<ServiceResponse>;

  getAppointmentById(id: string): Promise<Appointment | null>;

  getAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]>;

  getRecurrentAppointmentByCalendarId(calendarId: string): Promise<RecurrentAppointment[]>;

  getAllAppointmentsByCalendarId(calendarId: string): Promise<{appointments: Appointment[], recurrentAppointments: RecurrentAppointment[]}>;

  getConflictsOfUser(
    ownerId: string
  ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]>;

  getConflictsOfCalendar(
    calendarId: string
  ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]>;
}
