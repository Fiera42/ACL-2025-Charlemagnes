import {Appointment} from "../../domain/entities/Appointment";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {RecurrentAppointment} from "../../domain/entities/ReccurentAppointment";
import {RecursionRule} from "../../domain/entities/RecursionRule";
import {IAppointmentService} from "../../domain/interfaces/IAppointmentService";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {Sanitizer} from "./utils/Sanitizer";
import {encode} from "html-entities";

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
        return new Promise<Appointment>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }
            title = encode(title, {mode: 'extensive'});
            description = encode(description, {mode: 'extensive'});

            let appointment = Appointment.create(calendarId, title, description, startDate, endDate, ownerId);

            this.calendarDB.createAppointment(appointment)
                .then((appointment: Appointment) => {
                    resolve(appointment);
                })
                .catch((reason: any) => {
                    reject(reason);
                })
        })
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
