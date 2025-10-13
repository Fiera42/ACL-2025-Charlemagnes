import {Calendar} from "../../domain/entities/Calendar";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {ICalendarService} from "../../domain/interfaces/ICalendarService";
import {Sanitizer} from "./utils/Sanitizer";
import {decode, encode} from "html-entities";
import {IAuthDB} from "../../domain/interfaces/IAuthDB";

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

    removeCalendar(ownerId: string, calendarId: string): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    updateCalendar(
        ownerId: string,
        calendarId: string,
        calendar: Partial<Calendar>
    ): Promise<CalendarServiceResponse> {
        throw new Error("Method not implemented.");
    }

    getCalendarById(id: string): Promise<Calendar | null> {
        throw new Error("Method not implemented.");
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
