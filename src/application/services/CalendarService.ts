import {Calendar} from "../../domain/entities/Calendar";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {ICalendarService} from "../../domain/interfaces/ICalendarService";
import {Sanitizer} from "./utils/Sanitizer";
import {decode, encode} from "html-entities";
import {IAuthDB} from "../../domain/interfaces/IAuthDB";
import {Appointment} from "../../domain/entities/Appointment";

export class CalendarService implements ICalendarService {
    calendarDB: ICalendarDB;
    authDB: IAuthDB;

    constructor(calendarDB: ICalendarDB, authDB: IAuthDB) {
        this.calendarDB = calendarDB;
        this.authDB = authDB;
    }

    createCalendar(
        ownerId: string,
        name: string,
        description: string,
        color: string,
    ): Promise<Calendar> {
        return new Promise<Calendar>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }

            const user = await this.authDB.findUserById(ownerId)
                .catch((reason) => {
                    reject(reason);
                });

            if (user === undefined) return; // We already rejected in the catch
            if (user === null) {
                reject(new Error(`User of id (${ownerId}) does not exist`));
                return;
            }

            name = encode(name, {mode: 'extensive'});
            description = encode(description, {mode: 'extensive'});
            color = encode(color, {mode: 'extensive'});

            const calendar = Calendar.create(name, description, color, ownerId);

            this.calendarDB.createCalendar(calendar)
                .then((calendar: Calendar) => {
                    calendar.name = decode(calendar.name);
                    calendar.description = decode(calendar.description);
                    calendar.color = decode(calendar.color);
                    resolve(calendar);
                })
                .catch((reason: any) => {
                    reject(reason);
                });
        });
    }

    deleteCalendar(ownerId: string, calendarId: string): Promise<CalendarServiceResponse> {
        return new Promise<CalendarServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`CalendarID (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return; // We already rejected in the catch
            if (calendar === null) {
                resolve(CalendarServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== calendar.ownerId) {
                resolve(CalendarServiceResponse.FORBIDDEN);
                return;
            }

            const deleteResult = await this.calendarDB.deleteCalendar(calendarId)
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

    updateCalendar(
        ownerId: string,
        calendarId: string,
        partialCalendar: Partial<Calendar>
    ): Promise<CalendarServiceResponse> {
        return new Promise<CalendarServiceResponse>(async (resolve, reject) => {
            if (Sanitizer.doesStringContainSpecialChar(ownerId)) {
                reject(new Error(`OwnerID (${ownerId}) contains special char`));
                return;
            }
            if (Sanitizer.doesStringContainSpecialChar(calendarId)) {
                reject(new Error(`AppointmentId (${calendarId}) contains special char`));
                return;
            }

            const calendar = await this.calendarDB.findCalendarById(calendarId)
                .catch((reason) => {
                    reject(reason);
                });

            if (calendar === undefined) return; // We already rejected in the catch
            if (calendar === null) {
                resolve(CalendarServiceResponse.RESOURCE_NOT_EXIST);
                return;
            }
            if (ownerId !== calendar.ownerId
                || (partialCalendar.ownerId && partialCalendar.ownerId !== calendar.ownerId)
                || (partialCalendar.id && partialCalendar.id !== calendar.id)
            ) {
                resolve(CalendarServiceResponse.FORBIDDEN);
                return;
            }

            const cleanedCalendar: Partial<Appointment> = {
                ...(partialCalendar.name && {name: encode(partialCalendar.name, {mode: 'extensive'})}),
                ...(partialCalendar.description && {description: encode(partialCalendar.description, {mode: 'extensive'})}),
                ...(partialCalendar.color && {color: encode(partialCalendar.color, {mode: 'extensive'})}),
            };

            const updateResult = await this.calendarDB.updateCalendar(calendarId, cleanedCalendar)
                .catch((reason) => {
                    reject(reason);
                });
            if (updateResult === undefined) return; // We already rejected in the catch

            if (updateResult) {
                resolve(CalendarServiceResponse.SUCCESS)
            } else {
                resolve(CalendarServiceResponse.FAILED)
            }
        });
    }

    getCalendarById(calendarId: string): Promise<Calendar | null> {
        return new Promise<Calendar | null>(async (resolve, reject) => {
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
                resolve(null);
                return;
            }

            // We sanitized at creation, so we have to sanitize when getting it back
            calendar.name = decode(calendar.name);
            calendar.description = decode(calendar.description);
            calendar.color = decode(calendar.color);

            resolve(calendar);
        });
    }

    getCalendarsByOwnerId(ownerId: string): Promise<Calendar[]> {
        throw new Error("Method not implemented.");
    }

    shareCalendar(
        ownerId: string,
        calendarId: string,
        sharedToId: string
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    unShareCalendar(
        ownerId: string,
        calendarId: string,
        sharedToId: string
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }
}
