import { Calendar } from "../entities/Calendar";
import { CalendarServiceResponse } from "../entities/CalendarServiceResponse";

export interface ICalendarService {
  createCalendar(
    ownerId: string,
    name: string,
    description: string,
    color: string,
  ): Promise<Calendar>;

  removeCalendar(ownerId: string, calendarId: string): Promise<CalendarServiceResponse>;

  updateCalendar(
    ownerId: string,
    calendarId: string,
    calendar: Partial<Calendar>
  ): Promise<CalendarServiceResponse>;

  getCalendarById(id: string): Promise<Calendar | null>;

  getCalendarsByOwnerId(ownerId: string): Promise<Calendar[]>;

  shareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): Promise<CalendarServiceResponse>;

  unShareCalendar(
    ownerId: string,
    calendarId: string,
    sharedToId: string
  ): Promise<CalendarServiceResponse>;
}
