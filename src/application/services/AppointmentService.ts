import {Appointment} from "../../domain/entities/Appointment";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {RecurrentAppointment} from "../../domain/entities/ReccurentAppointment";
import {RecursionRule} from "../../domain/entities/RecursionRule";
import {IAppointmentService} from "../../domain/interfaces/IAppointmentService";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {Sanitizer} from "./utils/Sanitizer";
import {decode, encode} from "html-entities";

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
            if (Object.prototype.toString.call(startDate) !== '[object Date]' || isNaN(startDate.getTime())) {
                reject(new Error(`StartDate (${startDate}) is not valid`));
                return;
            }
            if (Object.prototype.toString.call(endDate) !== '[object Date]' || isNaN(endDate.getTime())) {
                reject(new Error(`EndDate (${endDate}) is not valid`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return; // We already rejected in the catch
            if (calendar === null) {
                reject(new Error(`CalendarId (${calendarId}) does not exist`));
                return;
            }
            if (ownerId !== calendar.ownerId) {
                reject(new Error(`User of id (${ownerId}) does not own calendar of id (${calendarId})`));
                return;
            }

            title = encode(title, {mode: 'extensive'});
            description = encode(description, {mode: 'extensive'});

            if (endDate < startDate) {
                let temp = endDate;
                endDate = startDate;
                startDate = temp;
            }

            const appointment = Appointment.create(calendarId, title, description, startDate, endDate, ownerId);

            this.calendarDB.createAppointment(appointment)
                .then((appointment: Appointment) => {
                    // We sanitized at creation, so we have to sanitize when getting it back
                    appointment.title = decode(appointment.title);
                    appointment.description = decode(appointment.description);
                    resolve(appointment);
                })
                .catch((reason: any) => {
                    reject(reason);
                })
        });
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
        return new Promise<CalendarServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(CalendarServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== appointment.ownerId) {
                resolve(CalendarServiceResponse.FORBIDDEN);
                return;
            }

            const deleteResult = await this.calendarDB.deleteAppointment(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });
            if (deleteResult === undefined) return; // We already rejected in the catch

            if (deleteResult) {
                resolve(CalendarServiceResponse.SUCCESS)
            } else {
                resolve(CalendarServiceResponse.FAILED)
            }
        });
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

    getAppointmentById(appointmentId: string): Promise<Appointment | null> {
        return new Promise<Appointment | null>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(appointmentId)) {
                reject(new Error(`AppointmentId (${appointmentId}) contains special char`));
                return;
            }

            const appointment = await this.calendarDB.findAppointmentById(appointmentId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointment === undefined) return; // We already rejected in the catch
            if (appointment === null) {
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            appointment.title = decode(appointment.title);
            appointment.description = decode(appointment.description);

            resolve(appointment);
        });
    }

    getAppointmentsByCalendarId(calendarId: string): Promise<Appointment[]> {
        return new Promise<Appointment[]>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarId (${calendarId}) contains special char`));
                return;
            }

            const appointments = await this.calendarDB.findAppointmentsByCalendarId(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (appointments === undefined) return; // We already rejected in the catch

            // We sanitized at creation, so we have to sanitize when getting it back
            appointments.forEach((appointment) => {
                appointment.title = decode(appointment.title);
                appointment.description = decode(appointment.description);
            })

            resolve(appointments);
        });
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
