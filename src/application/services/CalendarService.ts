import {Calendar} from "../../domain/entities/Calendar";
import {CalendarServiceResponse} from "../../domain/entities/CalendarServiceResponse";
import {ICalendarDB} from "../../domain/interfaces/ICalendarDB";
import {ICalendarService} from "../../domain/interfaces/ICalendarService";

export class CalendarService implements ICalendarService {
    calendarDB: ICalendarDB;

    constructor(calendarDB: ICalendarDB) {
        this.calendarDB = calendarDB;
    }

    createCalendar(
        ownerId: string,
        name: string,
        description: string
    ): Promise<Calendar | null> {
        throw new Error("Method not implemented.");
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
