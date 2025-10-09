import { Appointment } from "../entities/Appointment";
import { Calendar } from "../entities/Calendar";
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
  ): Appointment;

  createRecurrentAppointment(
    ownerId: string,
    calendarId: string,
    title: string,
    description: string,
    startDate: Date,
    endDate: Date,
    recursionRule: RecursionRule
  ): RecurrentAppointment;

  deleteAppointment(
    ownerId: string,
    calendarId: string,
    appointmentId: string
  ): CalendarServiceResponse;

  editAppointment(
    ownerId: string,
    calendarId: string,
    appointmentId: string,
    params: { [key: string]: any }
  ): CalendarServiceResponse;

  shareAppointment(
    ownerId: string,
    calendarId: string,
    appointmentId: string,
    sharedToId: string
  ): CalendarServiceResponse;

  unShareAppointment(
    ownerId: string,
    calendarId: string,
    appointmentId: string,
    sharedToId: string
  ): CalendarServiceResponse;

  getConflicts(
    ownerId: string
  ): { appointmentA: Appointment; appointmentB: Appointment }[];

  getConflicts(
    ownerId: string,
    calendarId: string
  ): { appointmentA: Appointment; appointmentB: Appointment }[];
}
