import {Appointment} from "../../domain/entities/Appointment";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {RecurrentAppointment} from "../../domain/entities/ReccurentAppointment";
import {RecursionRule} from "../../domain/entities/RecursionRule";
import {IAppointmentService} from "../../domain/interfaces/IAppointmentService";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";

export class AppointmentService implements IAppointmentService {
    calendarDB: ICalendarDB;

    constructor(calendarDB: ICalendarDB) {
        this.calendarDB = calendarDB;
    }

    createAppointment(
        ownerId: string,
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date
    ): Promise<Appointment> {
        throw new Error("Method not implemented.");
    }

    createRecurrentAppointment(
        ownerId: string,
        calendarId: string,
        title: string,
        description: string,
        startDate: Date,
        endDate: Date,
        recursionRule: RecursionRule
    ): Promise<RecurrentAppointment> {
        throw new Error("Method not implemented.");
    }

    deleteAppointment(
        ownerId: string,
        appointmentId: string
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    updateAppointment(
        ownerId: string,
        appointmentId: string,
        appointment: Partial<Appointment>
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    updateRecurrentAppointment(
        ownerId: string,
        appointmentId: string,
        appointment: Partial<RecurrentAppointment>
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    shareAppointment(
        ownerId: string,
        appointmentId: string,
        sharedToId: string
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    unShareAppointment(
        ownerId: string,
        appointmentId: string,
        sharedToId: string
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    getAppointmentById(id: string): Promise<Appointment | null> {
        throw new Error("Method not implemented.");
    }

    getAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        throw new Error("Method not implemented.");
    }

    getConflictsOfUser(
        ownerId: string
    ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]> {
        throw new Error("Method not implemented.");
    }

    getConflictsOfCalendar(
        calendarId: string
    ): Promise<{ appointmentA: Appointment; appointmentB: Appointment }[]> {
        throw new Error("Method not implemented.");
    }
}
